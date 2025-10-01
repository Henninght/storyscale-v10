import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText?: string;
  ctaHref?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
  ctaText = "Get Started",
  ctaHref = "/signup",
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-8 shadow-sm transition-all",
        highlighted
          ? "border-primary bg-primary/5 shadow-lg scale-105"
          : "border-secondary/10 bg-white hover:shadow-md"
      )}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-secondary">{name}</h3>
        <p className="mt-2 text-sm text-secondary/80">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-5xl font-bold text-secondary">${price}</span>
        <span className="text-secondary/80">/month</span>
      </div>

      <Link
        href={ctaHref}
        className={cn(
          "block w-full rounded-lg py-3 text-center font-semibold transition-all",
          highlighted
            ? "bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg"
            : "bg-secondary/10 text-secondary hover:bg-secondary/20"
        )}
      >
        {ctaText}
      </Link>

      <ul className="mt-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-sm text-secondary/80">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
