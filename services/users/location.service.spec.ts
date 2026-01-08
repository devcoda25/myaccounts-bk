/// <reference path="../../types/geoip-lite.d.ts" />
import { LocationService } from './location.service';

describe('LocationService', () => {
    let service: LocationService;

    beforeEach(() => {
        service = new LocationService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return null for localhost', () => {
        expect(service.getLocation('127.0.0.1')).toBeNull();
        expect(service.getLocation('::1')).toBeNull();
    });

    it('should return location for a known IP', () => {
        // Google DNS
        const loc = service.getLocation('8.8.8.8');
        console.log('Detected Location for 8.8.8.8:', loc);
        expect(loc).toBeDefined();
        expect(loc?.country).toBe('US');
    });

    it('should return null for invalid IP', () => {
        expect(service.getLocation('invalid-ip')).toBeNull();
    });
});
