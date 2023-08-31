import React, { useRef, useEffect } from "react";
import SvgGauge from "svg-gauge";

import {
  Switch,
  Card,
  CardBody,
  Divider,
  CardFooter,
  Image,
  Button,
} from "@nextui-org/react";

const defaultOptions = {
  animDuration: 1,
  showValue: true,
  max: 100,
  initialValue: 0,
  dialStartAngle: -70,
  dialEndAngle: -140,
  dialRadius: 40,
  color: (value) => {
    function getHexColor(value) {
      let string = value.toString(16);
      return string.length === 1 ? "0" + string : string;
    }
    let r = Math.floor(value * 2.55);
    let g = Math.floor(255 - value * 2.55);
    let b = 0;
    return "#" + getHexColor(r) + getHexColor(g) + getHexColor(b);
  },
};
const Gauge = (props) => {
  const gaugeEl = useRef(null);
  const gaugeRef = useRef(null);
  useEffect(() => {
    if (!gaugeRef.current) {
      const options = { ...defaultOptions, ...props };
      gaugeRef.current = SvgGauge(gaugeEl.current, options);
      gaugeRef.current.setValue(options.initialValue);
    }
    gaugeRef.current.setValueAnimated(props.value, 1);
  }, [props]);

  return <div ref={gaugeEl} className="gauge-container" />;
};

export default function Panel() {
  const [value, setValue] = React.useState(90);

  const onChange = (e) => {
    setValue(parseInt(e.currentTarget.value, 10));
  };

  const list = [
    { content: <Gauge value={value} />, title: "updateRate" },
    { content: <Gauge value={53} />, title: "updateCollateralPrice" },
  ];

  return (
    <div className=" items-center height-full">
      <div className="flex items-center space-x-4 text-small">
        <Button color="success">updateRate</Button>
        <Button color="success">updateCollateralPrice</Button>
        <Button color="success">redemptionPrice</Button>
      </div>
      <div className="flex items-center space-x-4 text-small">
        {list.map((item, index) => (
          <div key={index}>
            <Card
              shadow="sm"
              key={index}
              onPress={() => console.log("item pressed")}
            >
              <CardBody className="overflow-visible p-0">
                {item.content}
              </CardBody>
              <CardFooter className="text-small justify-between">
                <b>{item.title}</b>
              </CardFooter>
            </Card>
            <Divider orientation="vertical" />
          </div>
        ))}
      </div>
      <div className="col-sm-12">
        <input
          style={{ width: 400 }}
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={onChange}
        />
      </div>
      <div className="flex items-center space-x-4 text-small">
        <Switch defaultSelected color="default">
          Auto Tx
        </Switch>
        <Switch defaultSelected color="default">
          Default
        </Switch>
        <Switch defaultSelected color="danger">
          Default
        </Switch>
      </div>
    </div>
  );
}
