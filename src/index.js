import { calculate } from "./processor";
import * as chart from "./chart";
import * as text from "./text";
import * as monitoring from "./monitoring";
import * as configurator from "./configurator";
import { applyTheme, displayErrorPage, displayLoader, getCurrentTime, isTransit, withErrorHandling } from "./utils";

import "./styles/base.css";
import "./styles/spinner.css";
import "./styles/chart.css";
import "./styles/settings.css";


const UPDATE_INTERVAL = 1000;
let chartUpdater;

import { WebMidi } from 'webmidi';

WebMidi
  .enable()
  .then(() => console.log("WebMidi enabled!"))
  .catch(err => alert(err));

function run({ origin, transit, settings }) {
    console.info("[Configuration] %o", { origin, transit, settings });

    displayLoader(true);
    if (!origin || !settings) return;

    if (chartUpdater) {
        clearInterval(chartUpdater);
        chartUpdater = null;
    }

    let dataRadix = calculate(origin, settings);

    let dataTransit;
    if (isTransit(settings)) {
        dataTransit = calculate(transit, settings);
    }

    text.display(dataRadix, dataTransit, origin, transit, settings);
    chart.draw(dataRadix, dataTransit, settings);

    applyTheme(settings.stroke, settings.bg);
    displayLoader(false);

    const updateChart = withErrorHandling((currentTime) => {
        if (isTransit(settings)) {
            dataTransit = calculate({ ...transit, ...currentTime }, settings);
        } else {
            dataRadix = calculate({ ...origin, ...currentTime }, settings); 
            console.log(dataRadix);
            if (WebMidi.outputs.length > 0) {
                let output = WebMidi.outputs[0];
                let channel = output.channels[1];
                console.log("channel", channel);
            }
        }
        text.displayTime(dataRadix, dataTransit, settings);
        chart.draw(dataRadix, dataTransit, settings);
    }, displayErrorPage);

    if (origin.isCurrentTime || (isTransit(settings) && transit.isCurrentTime)) {
        chartUpdater = setInterval(() => updateChart(getCurrentTime(), settings), UPDATE_INTERVAL);
    }
}

withErrorHandling(async () => {
    monitoring.init();
    text.init();
    chart.init();
    configurator.init(run);
    run(await configurator.getParameters(new URLSearchParams(window.location.search)));
}, displayErrorPage)();
