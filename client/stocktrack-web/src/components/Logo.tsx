import { CSSProperties } from 'react';
import logoAsset from '../assets/stocktrack-logo.png';

type LogoProps = {
  className?: string;
  style?: CSSProperties;
};

export default function Logo({ className, style }: LogoProps) {
  const classes = ['stocktrack-logo', className]
    .filter((value): value is string => Boolean(value && value.trim()))
    .join(' ');

  return (
    <img
      src={logoAsset}
      alt="StockTrack logo"
      className={classes}
      style={style}
    />
  );
}
