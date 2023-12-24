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

let bodies = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
let signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
let aspects = ["conjunction","opposition", "trine", "square", "sextile"];

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
            
            // for each output on WebMidi
            for (let j = 0; j < WebMidi.outputs.length; j++) {
                var output = WebMidi.outputs[j];
                // console.log("channel", channel);
                
                // iterate throiugh all bodies
                for (let i = 0; i < bodies.length; i++) {
                    var channel = output.channels[i + 1];
                    var body = dataRadix.horoscope.Ephemeris[bodies[i]];
                    var alt = Math.floor(body.position.altaz.topocentric.altitude);
                    var az = Math.floor(body.position.altaz.topocentric.azimuth);
                    var house = dataRadix.horoscope._celestialBodies[bodies[i]].House.id;
                    var sign = signs.indexOf(dataRadix.horoscope._celestialBodies[bodies[i]].Sign.key);
                    console.log(body.key, alt, az, house, sign);                    
                    
                    // AZM 
                    var az_channel = Math.floor(az / 128) + 1
                    var az_remainder = az % 128;

                    for (let j = 1; j < az_channel; j++) 
                        channel.sendControlChange(j, 127);
                    channel.sendControlChange(az_channel, az_remainder);
                    for (let j = az_channel + 1; j < 4; j++) 
                        channel.sendControlChange(j, 0);

                    // ALT
                    if (alt < 0) {
                        channel.sendControlChange(4, Math.abs(alt) );
                        channel.sendControlChange(5, 0);
                    }
                    else {
                        channel.sendControlChange(4, 0);
                        channel.sendControlChange(5, alt);
                    }

                    // HOUSE
                    channel.sendControlChange(6, house);

                    // SIGN
                    channel.sendControlChange(7, sign);
                }
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
