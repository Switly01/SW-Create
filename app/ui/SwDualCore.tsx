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
      <span className="sw-dual-core-energy sw-dual-core-energy-one" aria-hidden="true" />
      <span className="sw-dual-core-energy sw-dual-core-energy-two" aria-hidden="true" />
      <span className="sw-dual-core-scan" aria-hidden="true" />
      <span className="sw-dual-core-chip" aria-hidden="true">SW//01</span>
      <span className="sw-dual-core-status" aria-hidden="true">SİBER ÇEKİRDEK</span>
    </span>
  );
}
