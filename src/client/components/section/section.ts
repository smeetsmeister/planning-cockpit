import {h} from 'maquette';

export let createSection = () => {
  return {
    renderMaquette: () => {
      return h('div.Section', { classes: { isExpanded: true } }, [
        h('div.Section-box', [
          h('div.Section-description', [
            'DUMMY SECTION'
          ])
        ])
      ]);
    }
  };
};
