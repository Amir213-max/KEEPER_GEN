import { Suspense } from "react";
import ShippingDetailsClient from "./ShippingDetailsClient";

export const dynamic = "force-dynamic";

export default function ShippingDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shipping details...</p>
        </div>
      </div>
    }>
      <ShippingDetailsClient />
    </Suspense>
  );
}

