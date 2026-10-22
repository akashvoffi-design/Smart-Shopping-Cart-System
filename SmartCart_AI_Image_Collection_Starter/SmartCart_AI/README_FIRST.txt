# SmartCart AI — Image Collection Starter Pack

This ZIP creates the requested 20-class folder structure and organizes candidate image collection by condition.

## Important
- The folders are empty starter folders; no web images have been downloaded into this ZIP.
- Google Images indexes images hosted by other websites. Search results are not automatically free to use.
- The included script attempts to collect candidate images from Google Images using `icrawler`. Search engines may block automated collection or change their pages. Use it responsibly and check the rights of every image before using it for training or redistribution.
- Downloaded images are candidates only. The script cannot guarantee that each image truly matches its condition query.
- The images are not annotated. YOLO object detection requires a bounding box for every target object.

## Folder structure
`raw_images/<class>/<condition>/`

Conditions:
- `angles`
- `distances`
- `lighting`
- `backgrounds`
- `occlusion`
- `multiple_items`

Files are named using the pattern:
`<class>__<condition>__001.jpg`

## Run on Windows
1. Extract this ZIP.
2. Open Command Prompt or the VS Code terminal inside the extracted `SmartCart_AI` folder.
3. Install dependencies:
   `python -m pip install icrawler`
4. Run the collector:
   `python collect_google_images.py --out raw_images --per-query 5`

This requests up to 6 condition searches per class (up to about 600 candidate images before search failures, duplicates, and irrelevant results).
To test one class first:
`python collect_google_images.py --out raw_images --per-query 3 --classes fresh_apple bisleri_water`

## Next steps
1. Review and remove irrelevant or duplicate images.
2. Confirm that you have varied real-world images, not only clean catalog shots.
3. Annotate objects in Roboflow or another YOLO annotation tool.
4. Split by capture session/source to reduce data leakage.
5. Validate labels before training.

## Current 20 classes
- `amul_masti_dahi`
- `bisleri_water`
- `britannia_bread`
- `britannia_fruit_cake`
- `fresh_apple`
- `fresh_banana`
- `fresh_broccoli`
- `fresh_carrot`
- `fresh_mushroom`
- `fresh_orange`
- `glazed_donut`
- `lays_classic`
- `parle_g`
- `fresh_tomato`
- `fresh_potato`
- `fresh_onion`
- `maggi_noodles`
- `kurkure`
- `amul_butter`
- `pepsi_can`
