import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <Image src="/circuspay-mark-transparent.png" width={54} height={54} alt="CircusPay" priority />
      <span>Circus<strong>Pay</strong></span>
    </div>
  );
}
