import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <Image src="/syncpay-logo.png" width={54} height={54} alt="Sync Pay" priority />
      <span>Sync <strong>Pay</strong></span>
    </div>
  );
}
