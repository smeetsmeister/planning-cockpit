import {Projector} from 'maquette';

export let fetchText = (url: string, projector: Projector) => {
  return fetch(url)
    .then((response) => response.text())
    .then((responseText) => {
      projector.scheduleRender();
      return responseText;
    });
};
