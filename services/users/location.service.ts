import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

export interface LocationData {
    country: string;
    city: string;
    ll: [number, number]; // Latitude, Longitude
    timezone?: string;
}

@Injectable()
export class LocationService {
    getLocation(ip: string): LocationData | null {
        // geoip-lite works best with public IPs.
        // For localhost, it returns null.
        if (!ip || ip === '127.0.0.1' || ip === '::1') {
            return null;
        }

        const geo = geoip.lookup(ip);
        if (!geo) {
            return null;
        }

        return {
            country: geo.country,
            city: geo.city,
            ll: geo.ll,
            timezone: geo.timezone
        };
    }
}
