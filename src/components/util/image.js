/* Utility functions to create objects to pass to deck.gl-raster */
import {
  colormap,
  combineBands,
  enhancedVegetationIndex,
  modifiedSoilAdjustedVegetationIndex,
  normalizedDifference,
  pansharpenBrovey,
  rgbaImage,
  soilAdjustedVegetationIndex,
} from '@kylebarron/deck.gl-raster';
import { getModisUrls, getNaipUrl, getLandsatUrl, getColormapUrl } from './url';
import { isTrueColor } from './landsat';
import { loadRgbImage, loadSingleBandImage } from './webgl';

export function loadImages(options) {
  const { z, useNaip = false } = options || {};

  if (z < 8) {
    return loadModisImages(options);
  }

  // Up to zoom 13 since I'm using @1x tiles
  if (z <= 13 || !useNaip) {
    return loadLandsatImages(options);
  }

  return loadNaipImages(options);
}

async function loadModisImages(options) {
  const modules = [rgbaImage];
  const url = getModisUrls(options)[0];

  const { imageData } = await loadRgbImage(url);
  const images = { imageRgba: imageData };

  return { images, modules };
}

async function loadLandsatImages(options) {
  const {
    gl,
    z,
    landsatBands,
    landsatColormapName,
    landsatBandCombination,
  } = options;
  const modules = [combineBands];
  const usePan = z >= 13 && isTrueColor(landsatBands);

  // Load pansharpen
  let imagePan;
  if (usePan) {
    const panUrl = getLandsatUrl(
      Object.assign(options, {
        landsatBands: 8,
      })
    );
    imagePan = loadSingleBandImage(panUrl);
    modules.push(pansharpenBrovey);
  }

  // Modules must be added before colormap module
  // Number of bands to load
  // TODO: check other band combinations for how many bands they use
  let maxBands = 3;
  switch (landsatBandCombination) {
    case 'normalizedDifference':
      modules.push(normalizedDifference);
      maxBands = 2;
      break;
    case 'enhancedVegetationIndex':
      modules.push(enhancedVegetationIndex);
      break;
    case 'soilAdjustedVegetationIndex':
      modules.push(soilAdjustedVegetationIndex);
      break;
    case 'modifiedSoilAdjustedVegetationIndex':
      modules.push(modifiedSoilAdjustedVegetationIndex);
      break;
    default:
      break;
  }

  const bandsUrls = landsatBands.slice(0, maxBands).map(band =>
    getLandsatUrl(
      Object.assign(options, {
        landsatBands: band,
      })
    )
  );

  // Note: imageBands (will be) an Array of objects, not direct textures
  const imageBands = bandsUrls.map(url => loadSingleBandImage(url));

  // Load colormap
  // Only load if landsatBandCombination is not RGB
  let imageColormap;
  if (landsatColormapName && landsatBandCombination !== 'rgb') {
    const colormapUrl = getColormapUrl(landsatColormapName);
    imageColormap = loadSingleBandImage(colormapUrl);
    modules.push(colormap);
  }

  // Await all images together
  await Promise.all([imagePan, imageBands, imageColormap]);

  // The `Promise.all(imageBands)` converts an array of Promises to an array of
  // objects
  const images = {
    imageBands: await Promise.all(imageBands),
    imageColormap: await imageColormap,
    imagePan: await imagePan,
  };

  return {
    images,
    modules,
  };
}

async function loadNaipImages(options) {
  const modules = [rgbaImage];
  const url = getNaipUrl(options);

  const { imageData, assets } = await loadRgbImage(url);
  const images = { imageRgba: imageData };

  return { images, modules, assets };
}
