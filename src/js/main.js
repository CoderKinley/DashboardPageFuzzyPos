import { CONFIG } from './config.js';
import { Utils } from '../../js/utils.js';
import { API } from './services/api.js';
import { Charts } from './components/charts.js';
import { UI } from './components/ui.js';
import { App } from './app.js';

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init());