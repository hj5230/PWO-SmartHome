/* eslint-disable no-unused-vars */
import React from "react";
import {
  Figure,
  Form,
  Navbar,
  Container,
  Card,
  Badge,
} from "react-bootstrap";
import on from "../on.png";
import off from "../off.png";
import { Chart } from "frappe-charts";

export default class SettingPage extends React.Component {
  constructor(props) {
    super(props);
    this.chartContainer = React.createRef();
    this.state = {
      heating: false,
      saved: false,
      outside: '', // outside temp fetched from api
      expect: '', // current temp inside
      length: '', // dimensions of the house
      width: '',
      height: '',
      wiA: '', // window area
      time: '', // time rquired to heat up
      paraMissing: true, // is any house parameter missing
      power: '',
      desired: '',
    };
  }

  generateChartData = () => {
    const { outside, expect, length, width, height, wiA, desired, preserve } = this.state;
    const data = {
      labels: [],
      datasets: [
        {
          name: "Energy",
          values: [],
        },
      ],
    };
  
    for (let power = 0; power <= 3000; power += 50) {
      const time = this.timeSimulate(
        parseFloat(length),
        parseFloat(width),
        parseFloat(height),
        parseFloat(wiA),
        parseFloat(outside),
        parseFloat(expect),
        parseFloat(desired),
        power
      );
      const energy = parseFloat(((power * time * 60) / 1000).toFixed(1));
      data.labels.push(power);
      data.datasets[0].values.push(energy);
    }
  
    return data;
  };

  updateChartData = () => {
    const chartData = this.generateChartData();
    if (this.energyPowerChart) {
      this.energyPowerChart.update(chartData);
    }
  };

  componentDidMount = async () => {
    this.timer = null;
    this.setState(
      () => {
        return {
          length: localStorage.getItem("length"),
          width: localStorage.getItem("width"),
          height: localStorage.getItem("height"),
          wiA: localStorage.getItem("wiA"),
          expect: (Math.random() * (22 - 18) + 18).toFixed(1),
        };
      },
      () => {
        const { length, width, height, wiA } = this.state;
        if (length && width && height && wiA)
          this.setState({
            paraMissing: false,
          });
      }
    );
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const datetime = `${year}-${month}-${day}T${hour}:00`;
    const url =
      "https://api.open-meteo.com/v1/forecast?latitude=60.17&longitude=24.94&hourly=temperature_2m";
    const response = await fetch(url);
    const data = await response.json();
    const index = data.hourly.time.indexOf(datetime);
    const temp = data.hourly.temperature_2m[index];
    this.setState({
      outside: temp,
    });
    const chartData = this.generateChartData();

  this.energyPowerChart = new Chart(this.chartContainer.current, {
    title: "Energy vs Power",
    data: chartData,
    type: "line",
    height: 250,
    colors: ["blue"],
    axisOptions: {
      xAxisMode: "tick",
      xIsSeries: true,
      xMin: this.state.preserve
    },
  });
  };

  componentDidUpdate(prevProps, prevState) {
    const { outside, expect, desired, length, width, height, wiA } = this.state;
  
    if (
      prevState.outside !== outside ||
      prevState.expect !== expect ||
      prevState.desired !== desired ||
      prevState.length !== length ||
      prevState.width !== width ||
      prevState.height !== height ||
      prevState.wiA !== wiA
    ) {
      this.updateChartData();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleSwitch = (e) => {
    const { name, checked } = e.target;
    this.setState({
      [name]: checked,
    });
  };

  handleSave = () => {
    this.setState({
      saved: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        saved: false,
      });
    }, 3000);
  };

  handleRange = (e) => {
    this.setState({
      saved: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        saved: false,
      });
    }, 3000);
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  heatLoss = (length, width, height, windowSize, outsideTemp, insideTemp) => {
    if (!(length && width && height && windowSize && outsideTemp && insideTemp))
      return "-";
    const U_wall = 0.4;
    const U_roof = 0.25;
    const U_window = 1.4;
    const perimeter = (length + width) * 2;
    const A_wall = perimeter * height;
    const A_roof = length * width;
    const A_window = windowSize;
    const deltaT = insideTemp - outsideTemp;
    const Q_wall = U_wall * A_wall * deltaT;
    const Q_roof = U_roof * A_roof * deltaT;
    const Q_window = U_window * A_window * deltaT;
    const Q_total = Q_wall + Q_roof + Q_window;
    return parseFloat(Q_total.toFixed(1));
  };

  timeSimulate = (
    length,
    width,
    height,
    windowSize,
    outsideTemp,
    insideTemp,
    targetTemp,
    powerInput
  ) => {
    if (
      !(
        length &&
        width &&
        height &&
        windowSize &&
        outsideTemp &&
        insideTemp &&
        targetTemp &&
        powerInput
      )
    )
      return "-";
    const maintainingPower = this.heatLoss(
      length,
      width,
      height,
      windowSize,
      outsideTemp,
      insideTemp
    );
    const volume = length * width * height;
    const density = 1.225; // kg/m³
    const specificHeatCapacity = 1.006; // kJ/(kg·K)
    const mass = volume * density;
    const deltaT = targetTemp - insideTemp;
    // Convert specific heat capacity to J/(kg·K)
    const specificHeatCapacityJ = specificHeatCapacity * 1000;
    const energyRequired = mass * specificHeatCapacityJ * deltaT; // in Joules

    // Calculate the power required to heat up
    const powerRequiredToHeatUp = powerInput - maintainingPower;

    // Calculate the time required in seconds
    const timeInSeconds = energyRequired / powerRequiredToHeatUp;

    // Convert the time to minutes
    const timeInMinutes = parseFloat((timeInSeconds / 60).toFixed(1));

    return timeInMinutes;
  };

  render() {
    const {
      heating,
      saved,
      paraMissing,
      outside,
      expect,
      desired,
      power,
      length,
      width,
      height,
      wiA,
    } = this.state;
    const preserve = this.heatLoss(
      parseFloat(length),
      parseFloat(width),
      parseFloat(height),
      parseFloat(wiA),
      parseFloat(outside),
      parseFloat(expect)
    );
    const time = this.timeSimulate(
      parseFloat(length),
      parseFloat(width),
      parseFloat(height),
      parseFloat(wiA),
      parseFloat(outside),
      parseFloat(expect),
      parseFloat(desired),
      parseFloat(power)
    );
    const energy = parseFloat(((power * time * 60) / 1000).toFixed(1));
    return (
      <>
        <Navbar bg="light" expand="lg">
          <Container>
            <Navbar.Brand href="/">SmartHome</Navbar.Brand>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              className="bi bi-wifi"
              viewBox="0 0 16 16"
            >
              <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3C5.259 3 2.723 3.882.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.716 2.164.205.148.49.13.668-.049z" />
              <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.455 9.455 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.576 1.336c.206.132.48.108.653-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.473 6.473 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.407.19.611.09A5.478 5.478 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.61-.091l.016-.015zM9.06 12.44c.196-.196.198-.52-.04-.66A1.99 1.99 0 0 0 8 11.5a1.99 1.99 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .707 0l.707-.707z" />
            </svg>
          </Container>
        </Navbar>
        <div className="saver">
          {saved ? <Badge>SETTING APPLIED</Badge> : <></>}
          {paraMissing ? (
            <Badge bg="danger">HOUSE PARAMETER MISSING</Badge>
          ) : (
            <></>
          )}
        </div>
        <div className="switch">
          <Card>
            <div className="container">
              {heating ? (
                <Figure.Image width={350} src={on} className="img" />
              ) : (
                <Figure.Image width={350} src={off} className="img" />
              )}
            </div>
            <Card.Body>
              <small style={{ fontWeight: "bold" }}>
                It's {outside}°C outside, and {expect}°C inside.
              </small>
              <br />
              <br />
              {paraMissing ? (
                <Form.Check
                  type="switch"
                  label="HEAT"
                  id="heating"
                  name="heating"
                  checked={false}
                  disabled
                />
              ) : (
                <Form.Check
                  type="switch"
                  label="HEAT"
                  id="heating"
                  name="heating"
                  checked={heating}
                  onChange={this.handleSwitch}
                />
              )}
              <br/>
              {heating ? (
                <>
                  <Form.Label>Desired Temperature&emsp;{desired}°C</Form.Label>
                  <Form.Range
                    onChange={this.handleRange}
                    name="desired"
                    min={expect}
                    max={30}
                    step={0.1}
                    value={desired}
                  />
                  <br />
                  <Form.Label>Power&emsp;{power}W</Form.Label>
                  <Form.Range
                    onChange={this.handleRange}
                    name="power"
                    min={preserve}
                    max={3000}
                    step={0.1}
                    value={power}
                  />
                  <br />
                  <small style={{ fontWeight: "bold" }}>
                    Heat up to {desired}°C within {time} mins.
                  </small>
                  <br/><br/>
                  {!isNaN(energy) && (
                    <small style={{ fontWeight: "bold" }}>
                      {energy}kWh will be consumed
                      to heat up to {desired}°C.
                    </small>
                  )}
                </>
              ) : (
                <>
                  <Form.Label>Desired Temperature&emsp;{desired}°C</Form.Label>
                  <Form.Range disabled />
                  <br />
                  <Form.Label>Power</Form.Label>
                  <Form.Range disabled />
                </>
              )}
            </Card.Body>
              <div ref={this.chartContainer} />
          </Card>
        </div>
      </>
    );
  }
}
