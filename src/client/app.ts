import {createSection} from './components/section/section';
import {h, Projector} from 'maquette';
import {fetchText} from './utilities/fetch-text';

export let createPlanningApplication = (projector: Projector) => {

  let section1 = createSection();

  let responseLength: number = undefined;

  fetchText('planning/Next%20Architectuur/', projector).then((responseText) => {
    responseLength = responseText.length;
  });

  return {
    renderMaquette: () => {
      return h('div', [
        responseLength !== undefined ? [
          'Response length: ' + responseLength
        ] : [],
        section1.renderMaquette()
      ]);
    }
  };
};
