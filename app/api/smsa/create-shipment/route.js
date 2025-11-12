import { NextResponse } from "next/server";

// SMSA Express API Configuration
const SMSA_API_ENDPOINT = process.env.SMSA_API_ENDPOINT || "https://ecomapis-sandbox.azurewebsites.net";
const SMSA_API_KEY = process.env.SMSA_API_KEY || "e984157a3da448f5bae9dc06d090500a";

/**
 * Create shipment with SMSA Express
 * Only for orders with country code SA and shipping type "normal"
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
    } = body;

    // Validate required fields
    if (!orderId || !customerName || !customerPhone || !shippingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: orderId, customerName, customerPhone, shippingAddress",
        },
        { status: 400 }
      );
    }

    // Prepare SMSA Express shipment data
    const shipmentData = {
      orderId: orderNumber || orderId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.replace(/[^0-9]/g, ""), // Remove non-numeric characters
      customerEmail: customerEmail || "",
      address: shippingAddress.address_line_1 || shippingAddress.address,
      city: shippingAddress.locality || shippingAddress.city || "",
      postalCode: shippingAddress.postal_code || shippingAddress.zip || "",
      countryCode: shippingAddress.country_code || "SA",
      items: items || [],
    };

    console.log("📦 Creating SMSA shipment:", {
      orderId: shipmentData.orderId,
      customerName: shipmentData.customerName,
      customerPhone: shipmentData.customerPhone,
    });

    // Call SMSA Express API
    const smsaResponse = await fetch(`${SMSA_API_ENDPOINT}/api/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SMSA_API_KEY,
        Authorization: `Bearer ${SMSA_API_KEY}`,
      },
      body: JSON.stringify({
        orderId: shipmentData.orderId,
        customerName: shipmentData.customerName,
        customerPhone: shipmentData.customerPhone,
        customerEmail: shipmentData.customerEmail,
        address: shipmentData.address,
        city: shipmentData.city,
        postalCode: shipmentData.postalCode,
        countryCode: shipmentData.countryCode,
        items: shipmentData.items.map((item) => ({
          productName: item.product_name || item.name || "Product",
          quantity: item.quantity || 1,
          sku: item.product_sku || item.sku || "",
        })),
      }),
    });

    // Check if response is OK
    if (!smsaResponse.ok) {
      const errorData = await smsaResponse.json().catch(() => ({
        message: "Failed to parse error response",
      }));
      console.error("❌ SMSA API Error:", errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || errorData.error || "SMSA API request failed",
          details: errorData,
        },
        { status: smsaResponse.status }
      );
    }

    const smsaData = await smsaResponse.json();

    console.log("✅ SMSA shipment created successfully:", smsaData);

    return NextResponse.json({
      success: true,
      shipmentId: smsaData.shipmentId || smsaData.id,
      trackingNumber: smsaData.trackingNumber || smsaData.tracking_number,
      message: "Shipment created successfully with SMSA Express",
      data: smsaData,
    });
  } catch (error) {
    console.error("❌ SMSA Integration Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create SMSA shipment",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

