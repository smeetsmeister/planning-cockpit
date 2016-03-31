///<reference path='../../typings/es6-promise/es6-promise.d.ts' />
///<reference path='../../typings/whatwg-fetch/whatwg-fetch.d.ts' />

import {createProjector} from 'maquette';
import {createPlanningApplication} from './app';

(window as any).require('whatwg-fetch');

let projector = createProjector({});
let app = createPlanningApplication(projector);
projector.append(document.body, app.renderMaquette);
