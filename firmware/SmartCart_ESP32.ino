/**
 * AI-POWERED SMART SHOPPING CART SYSTEM - ESP32 FIRMWARE (STAGE 1)
 * Hardware:
 *   - ESP32 NodeMCU / Dev Module
 *   - HX711 Load Cell Amplifier (24-bit ADC)
 *   - Load Cell (Single-point, 5kg / 10kg rated)
 *   - Green LED (Success / Item Added)
 *   - Red LED (Alert / Mismatch / Put-back Error)
 *   - Active Buzzer (Acoustic confirmation)
 *
 * Pin Connections (ESP32):
 *   - HX711 DT  -> GPIO 18 (or GPIO 5)
 *   - HX711 SCK -> GPIO 19 (or GPIO 6)
 *   - Green LED -> GPIO 21 (via 220 ohm resistor)
 *   - Red LED   -> GPIO 22 (via 220 ohm resistor)
 *   - Buzzer    -> GPIO 23 (via NPN transistor or direct if rated <= 12mA)
 *   - VCC       -> 3.3V (HX711) or 5V (Buzzer)
 *   - GND       -> Common Ground
 *
 * Serial Protocol: 115200 baud, newline-terminated JSON
 * Telemetry Output:
 *   {"device_id":"cart_stage1_01","weight_g":182.4,"delta_g":182.4,"stable":true,"timestamp":123456}
 * Inbound Command:
 *   {"cmd":"ack_add"}   -> Green LED flash + 1 Beep
 *   {"cmd":"alert_err"} -> Red LED flash + 2 Beeps
 *   {"cmd":"tare"}      -> Reset scale offset
 */

#include "HX711.h"

// Pin definitions
const int LOADCELL_DOUT_PIN = 18;
const int LOADCELL_SCK_PIN = 19;
const int LED_GREEN_PIN = 21;
const int LED_RED_PIN = 22;
const int BUZZER_PIN = 23;

HX711 scale;

// Calibration factor (adjust with a known test weight, e.g. 500g salt packet)
// calibration_factor = (reading - zero_offset) / known_weight_in_grams
float calibration_factor = 420.0f; 

float last_weight = 0.0f;
float last_reported_weight = 0.0f;
unsigned long last_read_time = 0;
const unsigned long READ_INTERVAL_MS = 250;
const float STABILITY_THRESHOLD_G = 3.0f;

void triggerBuzzer(int count, int durationMs, int pauseMs) {
  for (int i = 0; i < count; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < count - 1) delay(pauseMs);
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(calibration_factor);
  scale.tare(); // Zero the scale on startup

  // Startup indication: Green + Red flash and short chirp
  digitalWrite(LED_GREEN_PIN, HIGH);
  digitalWrite(LED_RED_PIN, HIGH);
  triggerBuzzer(1, 80, 0);
  delay(150);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN, LOW);

  Serial.println("{\"status\":\"booted\",\"device_id\":\"ESP32_STAGE1_CART01\",\"message\":\"Smart Cart HX711 Ready\"}");
}

void loop() {
  // Check for inbound commands from Laptop/Backend
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.indexOf("ack_add") >= 0) {
      digitalWrite(LED_GREEN_PIN, HIGH);
      triggerBuzzer(1, 100, 0);
      delay(200);
      digitalWrite(LED_GREEN_PIN, LOW);
    } else if (cmd.indexOf("alert_err") >= 0) {
      digitalWrite(LED_RED_PIN, HIGH);
      triggerBuzzer(2, 80, 60);
      delay(200);
      digitalWrite(LED_RED_PIN, LOW);
    } else if (cmd.indexOf("tare") >= 0) {
      scale.tare();
      triggerBuzzer(1, 150, 0);
      Serial.println("{\"status\":\"tared\",\"weight_g\":0.0}");
    }
  }

  // Periodic weight sampling
  unsigned long now = millis();
  if (now - last_read_time >= READ_INTERVAL_MS) {
    last_read_time = now;

    if (scale.is_ready()) {
      float current_weight = scale.get_units(2); // Average of 2 readings
      if (current_weight < 0.0f) current_weight = 0.0f; // Clip negative noise

      float weight_diff = abs(current_weight - last_weight);
      bool is_stable = (weight_diff <= STABILITY_THRESHOLD_G);
      float delta_from_last_reported = current_weight - last_reported_weight;

      // Only send when there is a meaningful change (> 5g) or periodically when stable
      if (abs(delta_from_last_reported) >= 5.0f || (is_stable && abs(current_weight - last_reported_weight) > 2.0f)) {
        Serial.print("{\"device_id\":\"ESP32_STAGE1_CART01\",\"weight_g\":");
        Serial.print(current_weight, 1);
        Serial.print(",\"delta_g\":");
        Serial.print(delta_from_last_reported, 1);
        Serial.print(",\"stable\":");
        Serial.print(is_stable ? "true" : "false");
        Serial.print(",\"timestamp\":");
        Serial.print(now);
        Serial.println("}");

        last_reported_weight = current_weight;
      }

      last_weight = current_weight;
    }
  }
}
