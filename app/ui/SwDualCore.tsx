type SwDualCoreProps = {
  className?: string;
  label?: string;
};

export function SwDualCore({ className = "", label = "SW Create" }: SwDualCoreProps) {
  return (
    <span className={`sw-dual-core ${className}`.trim()} role="img" aria-label={label}>
      <span className="sw-dual-core-face sw-dual-core-tech" aria-hidden="true">
        <img src="/brand/swcreate-logo.png" alt="" />
      </span>
      <span className="sw-dual-core-pixels" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} />)}
      </span>
      <span className="sw-dual-core-energy sw-dual-core-energy-one" aria-hidden="true" />
      <span className="sw-dual-core-energy sw-dual-core-energy-two" aria-hidden="true" />
      <span className="sw-dual-core-scan" aria-hidden="true" />
    </span>
  );
}
