/**
 * Configuration options for IP extraction
 */
interface IPExtractorOptions {
  trustProxy?: boolean;
  headerPriority?: string[];
}

/**
 * Result object containing all possible IPs from request
 */
interface AllIPsResult {
  direct: string | null;
  headers: Record<string, string>;
}

/**
 * Extended Request interface with clientIP property
 */
interface RequestWithIP extends Request {
  clientIP?: string | null;
}

/**
 * Get client IP from request object
 * @param req - Express/Node.js request object
 * @param options - Configuration options
 * @returns Client IP address or null
 */
export function getClientIP(
  req: Request,
  options: IPExtractorOptions = {}
): string | null {
  const {
    trustProxy = false,
    headerPriority = [
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip',
      'true-client-ip',
      'x-client-ip',
      'x-cluster-client-ip',
      'forwarded',
      'x-forwarded',
      'forwarded-for'
    ]
  } = options;

  // If we trust proxy headers, check them first
  if (trustProxy) {
    for (const header of headerPriority) {
      const ip = getIPFromHeader(req, header);
      if (ip) return ip;
    }
  }

  // Fallback to direct connection IP
  return getDirectIP(req);
}

/**
 * Get IP from specific header
 * @param req - Request object
 * @param headerName - Header name to check
 * @returns IP address or null
 */
export function getIPFromHeader(
  req: Request,
  headerName: string
): string | null {
  const value = req.headers[headerName.toLowerCase()];
  
  if (!value) return null;

  const headerValue = Array.isArray(value) ? value[0] : value;

  // Handle RFC 7239 'Forwarded' header
  if (headerName.toLowerCase() === 'forwarded') {
    const match = headerValue.match(/for=([^;,\s]+)/i);
    if (match) {
      return cleanIP(match[1]);
    }
    return null;
  }

  // Handle X-Forwarded-For with multiple IPs
  // Format: "client, proxy1, proxy2"
  const ips = headerValue.split(',').map(ip => ip.trim());
  
  // Return the first (leftmost) IP which is typically the original client
  return cleanIP(ips[0]);
}

/**
 * Get IP directly from socket connection
 * @param req - Request object
 * @returns IP address or null
 */
export function getDirectIP(req: Request): string | null {
  // Try different socket properties
  const ip = req.socket?.remoteAddress || 
             req.connection?.remoteAddress ||
             (req as any).info?.remoteAddress; // For some frameworks
  
  return cleanIP(ip);
}

/**
 * Clean and normalize IP address
 * @param ip - Raw IP address
 * @returns Cleaned IP or null
 */
export function cleanIP(ip: string | undefined): string | null {
  if (!ip) return null;

  // Remove quotes and brackets
  let cleanedIP = ip.replace(/["'\[\]]/g, '').trim();

  // Handle IPv6-mapped IPv4 addresses (::ffff:192.168.1.1)
  if (cleanedIP.startsWith('::ffff:')) {
    cleanedIP = cleanedIP.substring(7);
  }

  // Basic validation
  if (isValidIP(cleanedIP)) {
    return cleanedIP;
  }

  return null;
}

/**
 * Validate IP address format
 * @param ip - IP address to validate
 * @returns True if valid
 */
export function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  if (ipv4Regex.test(ip)) {
    // Validate IPv4 octets are 0-255
    return ip.split('.').every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Regex.test(ip);
}

/**
 * Get all possible IPs from request
 * @param req - Request object
 * @returns Object with all found IPs
 */
export function getAllIPs(req: Request): AllIPsResult {
  const result: AllIPsResult = {
    direct: getDirectIP(req),
    headers: {}
  };

  // Common headers to check
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'true-client-ip',
    'x-client-ip',
    'forwarded'
  ];

  headers.forEach(header => {
    const ip = getIPFromHeader(req, header);
    if (ip) {
      result.headers[header] = ip;
    }
  });

  return result;
}


// Default export
export default {
  getClientIP,
  getIPFromHeader,
  getDirectIP,
  cleanIP,
  isValidIP,
  getAllIPs,
};