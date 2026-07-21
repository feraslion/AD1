import QRCode from 'qrcode';

/**
 * ZATCA (Fatoora) Phase 1 & 2 TLV (Tag-Length-Value) Base64 Encoder
 * Tag 1: Seller Name
 * Tag 2: VAT Registration Number
 * Tag 3: Timestamp (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Total
 */
export function generateZatcaTlvBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: number,
  vatAmount: number
): string {
  const getTlvBuffer = (tag: number, value: string): Uint8Array => {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    const tagLength = valueBytes.length;
    const buf = new Uint8Array(2 + tagLength);
    buf[0] = tag;
    buf[1] = tagLength;
    buf.set(valueBytes, 2);
    return buf;
  };

  const tlv1 = getTlvBuffer(1, sellerName || 'متجرنا التجاري');
  const tlv2 = getTlvBuffer(2, vatNumber || '300000000000003');
  const tlv3 = getTlvBuffer(3, timestamp || new Date().toISOString());
  const tlv4 = getTlvBuffer(4, totalAmount.toFixed(2));
  const tlv5 = getTlvBuffer(5, vatAmount.toFixed(2));

  const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  [tlv1, tlv2, tlv3, tlv4, tlv5].forEach(buf => {
    combined.set(buf, offset);
    offset += buf.length;
  });

  // Convert Uint8Array to base64
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Generate a Data URL QR code image from ZATCA TLV string
 */
export async function generateZatcaQrDataUrl(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  totalAmount: number,
  vatAmount: number
): Promise<string> {
  try {
    const base64Tlv = generateZatcaTlvBase64(sellerName, vatNumber, timestamp, totalAmount, vatAmount);
    const qrDataUrl = await QRCode.toDataURL(base64Tlv, {
      margin: 1,
      width: 160,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('Failed to generate ZATCA QR Code:', err);
    return '';
  }
}
