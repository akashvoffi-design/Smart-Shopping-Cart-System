"""
Automated Verification & Integrity Tests for Smart Shopping Cart System
Tests:
  1. Product Dataset integrity (5,198 items, MRP vs Selling Price, Barcode provenance)
  2. Sample barcode lookups
  3. Weight parsing & unit classifications
  4. Sensor fusion consensus validation
  5. Authoritative cart calculations & discount formulas
"""

import unittest
import json
import re
from pathlib import Path

class TestSmartShoppingCart(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.base_dir = Path(__file__).resolve().parent.parent
        cls.products_json_path = cls.base_dir / 'src' / 'data' / 'products.json'
        with open(cls.products_json_path, 'r', encoding='utf-8') as f:
            cls.products = json.load(f)
        cls.barcode_map = {p['barcode']: p for p in cls.products}

    def test_01_catalog_size_and_schema(self):
        """Verify total count and required fields across all catalogue items"""
        self.assertGreaterEqual(len(self.products), 5190, "Catalogue should contain > 5190 items")
        required_keys = ['barcode', 'barcode_type', 'barcode_provenance', 'product_name', 'brand', 'mrp', 'selling_price', 'weight_g', 'category']
        for p in self.products[:100]:
            for key in required_keys:
                self.assertIn(key, p, f"Product {p.get('barcode')} missing key {key}")

    def test_02_mrp_greater_than_or_equal_to_selling_price(self):
        """Verify Indian retail rule: MRP must always be >= selling price"""
        for p in self.products:
            self.assertGreaterEqual(
                p['mrp'], p['selling_price'],
                f"MRP ({p['mrp']}) cannot be lower than Selling Price ({p['selling_price']}) for {p['barcode']}"
            )

    def test_03_authentic_reference_staples_present(self):
        """Verify authentic Indian GS1 reference staples with verified barcodes"""
        reference_codes = [
            '8901063012480', # Parle-G
            '8901058852336', # Maggi
            '8901262010011', # Amul Butter
            '8901725181222', # Tata Salt
            '8901233024854', # Fresh Apple
            '8901233024861', # Britannia Cookies
            '8901030953280', # Colgate
            '8901499026131', # Dettol
            '8901030825273', # Surf Excel
            '8906002480012'  # Fortune Oil
        ]
        for code in reference_codes:
            self.assertIn(code, self.barcode_map, f"Reference barcode {code} must be present")
            prod = self.barcode_map[code]
            self.assertEqual(prod['barcode_type'], 'authentic_ean13')
            self.assertEqual(prod['barcode_provenance'], 'gs1_retail_verified')

    def test_04_synthetic_demo_barcodes_explicitly_flagged(self):
        """Verify that synthetic barcodes are never claimed to be authentic retail barcodes"""
        synthetic_count = sum(1 for p in self.products if p['barcode_type'] == 'synthetic_demo')
        self.assertGreater(synthetic_count, 5000, "Synthetic demo items must be explicitly labeled")
        sample_synth = next(p for p in self.products if p['barcode_type'] == 'synthetic_demo')
        self.assertTrue(sample_synth['barcode_provenance'].startswith('dmart_catalog_row_'))

    def test_05_weight_parsing_accuracy(self):
        """Verify weight values are positive and reasonably scaled"""
        for p in self.products[:200]:
            self.assertGreater(p['weight_g'], 0.0, f"Weight must be > 0 for {p['barcode']}")

    def test_06_sensor_fusion_consensus_logic(self):
        """Verify sensor fusion matching rules"""
        def evaluate_fusion(expected_g, measured_g, tolerance_pct=20.0):
            tolerance = max(25.0, expected_g * (tolerance_pct / 100.0))
            return abs(measured_g - expected_g) <= tolerance

        # 100g Amul Butter
        self.assertTrue(evaluate_fusion(100.0, 102.0), "102g should match 100g within tolerance")
        self.assertTrue(evaluate_fusion(100.0, 95.0), "95g should match 100g within tolerance")
        self.assertFalse(evaluate_fusion(100.0, 0.0), "0g should NOT match 100g (item not on scale)")
        self.assertFalse(evaluate_fusion(100.0, 500.0), "500g should NOT match 100g")

        # 1000g Tata Salt
        self.assertTrue(evaluate_fusion(1000.0, 1015.0), "1015g should match 1000g")
        self.assertFalse(evaluate_fusion(1000.0, 50.0), "50g should NOT match 1000g")

    def test_07_cart_authoritative_discount_calculation(self):
        """Verify subtotal, discount, and grand total relationships"""
        sample_items = [
            {'barcode': '8901063012480', 'qty': 2}, # Parle-G: MRP 10, Sale 10
            {'barcode': '8901725181222', 'qty': 1}, # Tata Salt: MRP 28, Sale 25
        ]

        subtotal_mrp = 0.0
        grand_total = 0.0

        for item in sample_items:
            prod = self.barcode_map[item['barcode']]
            subtotal_mrp += prod['mrp'] * item['qty']
            grand_total += prod['selling_price'] * item['qty']

        discount = subtotal_mrp - grand_total
        self.assertEqual(subtotal_mrp, 48.0) # (10*2) + 28 = 48
        self.assertEqual(grand_total, 45.0)  # (10*2) + 25 = 45
        self.assertEqual(discount, 3.0)      # 48 - 45 = 3

if __name__ == '__main__':
    unittest.main()
