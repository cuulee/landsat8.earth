import React from 'react';
import { Form, Select, Grid, Header } from 'semantic-ui-react';
import bandChoices from '../constants/band_choices.json';
import bandPresets from '../constants/band_presets.json';
import bandCombinations from '../constants/band_combinations.json';
import ColormapSelection from './colormap';
import { arrayToProps } from '../util/util';

function SingleBandSelector(props) {
  const { i, landsatBands, onChange } = props;
  return (
    <Select
      value={landsatBands[i] || 1}
      options={bandChoices}
      onChange={(event, object) => {
        // Take copy of landsatBands array so that I don't modify the master
        // bandPresets
        const newLandsatBands = landsatBands.slice();
        newLandsatBands[i] = object.value;
        onChange({ landsatBands: newLandsatBands, landsatBandPreset: null });
      }}
    />
  );
}

export default function BandSelection(props) {
  const {
    landsatBands,
    landsatBandPreset,
    landsatBandCombination,
    landsatColormapName,
    filter_min_r,
    filter_max_r,
    onChange,
  } = props;

  return (
    <div>
      <Header as="h4">Presets</Header>
      <BandPresetSelection
        landsatBandPreset={landsatBandPreset}
        onChange={onChange}
      />
      <Header as="h5">Band Choice</Header>
      <BandChoice
        nBands={bandCombinations[landsatBandCombination].nBands}
        landsatBands={landsatBands}
        onChange={onChange}
      />
      <Header as="h5">Band Interpretation</Header>
      <BandCombinationSelection
        landsatBandCombination={landsatBandCombination}
        onChange={onChange}
      />

      <FilterSlider filter_min_r={filter_min_r} onChange={onChange} />

      {/* Only show ColormapSelection when creating index of some kind */}
      {landsatBandCombination !== 'rgb' && (
        <div>
          <Header as="h5">Colormap</Header>
          <ColormapSelection
            landsatColormapName={landsatColormapName}
            onChange={onChange}
          />
        </div>
      )}
    </div>
  );
}

function FilterSlider(props) {


  export function OpacitySlider(props) {
    const { value, name, onChange } = props;

    return (
      <Form.Input
        label={`Opacity: ${value}`}
        min={0}
        max={1}
        name={name}
        onChange={onChange}
        step={0.05}
        type="range"
        value={value}
      />
    );
  }

}

function BandPresetSelection(props) {
  const { landsatBandPreset, onChange } = props;

  return (
    <div>
      <Select
        placeholder="Choose a Preset"
        value={landsatBandPreset}
        options={arrayToProps(Object.values(bandPresets))}
        fluid
        onChange={(event, object) => {
          const newLandsatBandPreset = object.value;
          const presetData = bandPresets[newLandsatBandPreset];
          const { landsatBands, bandCombination } = presetData;
          onChange({
            landsatBandPreset: newLandsatBandPreset,
            landsatBands,
            landsatBandCombination: bandCombination,
          });
        }}
      />
    </div>
  );
}

function BandChoice(props) {
  const { nBands, landsatBands, onChange } = props;

  return (
    <Grid>
      <Grid.Column>
        {[...Array(nBands).keys()].map(i => (
          <Grid.Row key={i}>
            <SingleBandSelector
              landsatBands={landsatBands}
              onChange={onChange}
              i={i}
            />
          </Grid.Row>
        ))}
      </Grid.Column>
    </Grid>
  );
}

function BandCombinationSelection(props) {
  const { landsatBandCombination, onChange } = props;

  return (
    <Select
      placeholder="Choose a Band Combination"
      value={landsatBandCombination}
      options={arrayToProps(Object.values(bandCombinations))}
      onChange={(event, object) => {
        onChange({
          landsatBandCombination: object.value,
          landsatBandPreset: null,
        });
      }}
    />
  );
}
