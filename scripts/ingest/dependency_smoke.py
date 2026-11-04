"""Exercise ingest dependencies with synthetic fixtures, without publishing data.

Run with the Python environment installed from scripts/ingest/requirements.txt:
    python scripts/ingest/dependency_smoke.py
All fixtures live in a temporary directory. No network or raw datasets are needed.
"""
import gzip
import importlib.util
import io
import json
import math
import sys
import tempfile
from pathlib import Path

import h5py
import numpy as np
import PIL
import pyproj
import rasterio
import shapely
from PIL import Image
from pyproj import Geod
from rasterio.enums import Resampling
from rasterio.features import rasterize
from rasterio.mask import mask
from rasterio.merge import merge
from rasterio.transform import from_origin
from rasterio.warp import calculate_default_transform, reproject
from shapely.geometry import mapping, shape


def check_dependencies(directory):
    values = np.arange(16, dtype="float32").reshape(4, 4)
    transform = from_origin(100, 14, .01, .01)
    bounds = (100, 13.96, 100.04, 14)
    polygon = shape({"type": "Polygon", "coordinates": [[
        [100, 13.96], [100.04, 13.96], [100.04, 14], [100, 14], [100, 13.96]
    ]]})

    buffer = io.BytesIO()
    with h5py.File(buffer, "w") as dataset:
        dataset["AGB"] = values
    with h5py.File(io.BytesIO(buffer.getvalue()), "r") as dataset:
        np.testing.assert_equal(dataset["AGB"][:], values)
    print("PASS HDF5 byte-buffer read/write and slicing", flush=True)

    assert polygon.is_valid
    burned = rasterize([(mapping(polygon), 1)], out_shape=(4, 4),
                       transform=transform, dtype="uint8")
    assert burned.sum() == 16
    print("PASS Shapely mapping and rasterization", flush=True)

    raster_path = directory / "fixture.tif"
    with rasterio.open(raster_path, "w", driver="GTiff", width=4, height=4,
                       count=1, dtype="float32", crs="EPSG:4326",
                       transform=transform, nodata=-9999) as dataset:
        dataset.write(values, 1)
    with rasterio.open(raster_path) as dataset:
        np.testing.assert_equal(dataset.read(1), values)
        clipped, _ = mask(dataset, [mapping(polygon)], crop=True)
        np.testing.assert_equal(clipped[0], values)
        mosaic, _ = merge([dataset], bounds=bounds, res=.01, nodata=0)
        np.testing.assert_equal(mosaic[0], values)
        window = rasterio.windows.from_bounds(100, 13.96, 100.02, 14, transform)
        assert dataset.read(1, window=window).shape == (4, 2)
    compressed_path = directory / "fixture.tif.gz"
    compressed_path.write_bytes(gzip.compress(raster_path.read_bytes()))
    with rasterio.open("/vsigzip/" + str(compressed_path)) as dataset:
        np.testing.assert_equal(dataset.read(1), values)
    print("PASS GeoTIFF mask/window/mosaic and compressed raster", flush=True)

    projected_transform, width, height = calculate_default_transform(
        "EPSG:4326", "EPSG:3857", 4, 4, *bounds, resolution=1000)
    projected = np.full((height, width), np.nan, np.float32)
    reproject(values, projected, src_transform=transform, src_crs="EPSG:4326",
              dst_transform=projected_transform, dst_crs="EPSG:3857",
              src_nodata=np.nan, dst_nodata=np.nan, resampling=Resampling.average)
    assert np.isfinite(projected).any()
    classes = np.zeros((4, 4), np.uint8)
    reproject(burned, classes, src_transform=transform, src_crs="EPSG:4326",
              dst_transform=transform, dst_crs="EPSG:4326", resampling=Resampling.mode)
    np.testing.assert_equal(classes, burned)
    area, _ = Geod(ellps="WGS84").polygon_area_perimeter(
        [100, 100.04, 100.04, 100], [13.96, 13.96, 14, 14])
    assert 18e6 < abs(area) < 20e6
    print("PASS average/mode reprojection and ellipsoidal area", flush=True)

    # Match the production overlay's palette and transparent-index path.
    indices = np.array([[0, 1], [2, 1]], dtype="uint8")
    image = Image.fromarray(indices, "P")
    image.putpalette([0, 0, 0, 255, 0, 0, 0, 255, 0] + [0] * 759)
    palette_path = directory / "palette.png"
    image.save(palette_path, optimize=True, transparency=0)
    with Image.open(palette_path) as restored:
        assert restored.mode == "P" and restored.info["transparency"] == 0
        np.testing.assert_equal(np.asarray(restored), indices)
    print("PASS indexed PNG palette/transparency roundtrip", flush=True)


def check_production_helpers():
    # Import definitions only; never execute main() or write bytecode into the repo.
    sys.dont_write_bytecode = True
    source = Path(__file__).resolve().with_name("build_ledger.py")
    spec = importlib.util.spec_from_file_location("build_ledger", source)
    ledger = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ledger)
    assert math.isclose(ledger.AGB_TO_CO2E, (1 + .27) * .47 * 44 / 12,
                        rel_tol=0, abs_tol=1e-12)
    indices = np.array([0, 0, 1, 1])
    weights = np.array([.1, .2, 0., 0.])
    fallback = np.array([.4, .4, .3, .3])
    weighted = ledger.with_fallback(indices, weights, fallback, 2)
    np.testing.assert_allclose(weighted, [.1, .2, .3, .3])
    np.testing.assert_allclose(np.bincount(indices, weights=weighted), [.3, .6])
    assert np.nan_to_num(np.array([np.nan]), nan=0.).item() == 0
    print("PASS production factor and coastal-cell fallback aggregation", flush=True)


def main():
    modules = (np, h5py, rasterio, shapely, pyproj, PIL)
    print(json.dumps({"python": sys.version.split()[0], "dependencies": {
        module.__name__: module.__version__ for module in modules}}), flush=True)
    with tempfile.TemporaryDirectory(prefix="carbon-ingest-smoke-") as directory:
        check_dependencies(Path(directory))
        check_production_helpers()
    print("PASS ingestion dependency smoke; no ledger publication", flush=True)


if __name__ == "__main__":
    main()
