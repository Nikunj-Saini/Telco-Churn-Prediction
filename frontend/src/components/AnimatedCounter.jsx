import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ value, decimals = 1, prefix = '', suffix = '', duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startValRef = useRef(0);
  const targetVal = parseFloat(value) || 0;

  useEffect(() => {
    let startTimestamp = null;
    const startValue = startValRef.current;
    const diff = targetVal - startValue;

    if (diff === 0) {
      setDisplayValue(targetVal);
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out cubic function for a snappy, luxurious deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOutCubic;
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        startValRef.current = targetVal;
        setDisplayValue(targetVal);
      }
    };

    requestAnimationFrame(step);
  }, [targetVal, duration]);

  const formattedNumber = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toString();

  return (
    <span className="font-mono tabular-nums">
      {prefix}{formattedNumber}{suffix}
    </span>
  );
};

export default AnimatedCounter;
