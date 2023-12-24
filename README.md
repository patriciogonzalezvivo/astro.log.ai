
This is project is based on [Quick Astro Charts]https://github.com/ilyai/quick-astro-charts) by [Ilya Igonkin](https://github.com/ilyai)

```
git clone https://github.com/patriciogonzalezvivo/astro.log.ai
cd astro.log.ais
npm install
npm run start
```

# Midi events

| Channel   |  Body         | 
|-----------|:-------------:|
| 1         | `sun`         |
| 2         | `moon`        |
| 3         | `mercury`     |
| 4         | `venus`       |
| 5         | `mars`        |
| 6         | `jupiter`     |
| 7         | `saturn`      |
| 8         | `uranus`      |
| 9         | `neptune`     |
| 10        | `pluto`       |

For each channel:

| CC        |  Type         | 
|-----------|:-------------:|
| 1         | `az_1`        |
| 2         | `az_2`        |
| 3         | `az_3`        |
| 4         | `alt_neg`     |
| 5         | `alt_pos`     |
| 6         | `house`       |
| 7         | `sign`        |

Where:
- The **azimuth** 
- The **altitud** can be negative (from -90 to 0) or positive (from 0 to 90)

