import {createSection} from '../../../../src/client/components/section/section';
import {createTestProjector} from 'maquette-query';
/* tslint:disable:no-require-imports */
import chai = require('chai');
let expect = chai.expect;

describe('Section', () => {

  it('renders DUMMY SECTION', () => {
    let section = createSection();

    let projector = createTestProjector(section.renderMaquette);

    expect(projector.query('.Section-description').textContent).to.equal('DUMMY SECTION');
  });
});
