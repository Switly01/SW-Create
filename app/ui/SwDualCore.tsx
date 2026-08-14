type SwDualCoreProps = {
  className?: string;
  label?: string;
};

export function SwDualCore({ className = "", label = "SW Create" }: SwDualCoreProps) {
  return (
    <span className={`sw-dual-core ${className}`.trim()} role="img" aria-label={label}>
      <span className="sw-dual-core-face sw-dual-core-original" aria-hidden="true">
        <img src="/brand/swcreate-logo.png" alt="" />
      </span>
      <span className="sw-dual-core-face sw-dual-core-tech" aria-hidden="true">
        <img src="/brand/swcreate-logo.png" alt="" />
      </span>
      <span className="sw-dual-core-divider" aria-hidden="true" />
      <span className="sw-dual-core-scan" aria-hidden="true" />
      <span className="sw-dual-core-chip" aria-hidden="true">01</span>
      <span className="sw-dual-core-status" aria-hidden="true">ORIGINAL / TECH</span>
    </span>
  );
}
