/**
 * Bluetooth Web API Service for Wearable Device Integration
 * Supports direct Bluetooth Low Energy (BLE) connections to fitness trackers
 */

export class BluetoothService {
    constructor() {
        this.device = null;
        this.server = null;
        this.characteristics = new Map();
        this.isConnected = false;
        this.listeners = new Map();

        // Standard Bluetooth service UUIDs for health devices
        this.services = {
            HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
            BATTERY: '0000180f-0000-1000-8000-00805f9b34fb',
            DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
            FITNESS_MACHINE: '00001826-0000-1000-8000-00805f9b34fb',
            CYCLING_POWER: '00001818-0000-1000-8000-00805f9b34fb',
            RUNNING_SPEED: '00001814-0000-1000-8000-00805f9b34fb'
        };

        this.characteristics = {
            HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
            BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
            DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
            MANUFACTURER_NAME: '00002a29-0000-1000-8000-00805f9b34fb',
            STEP_COUNT: '00002a55-0000-1000-8000-00805f9b34fb'
        };
    }

    /**
     * Check if Web Bluetooth is supported
     */
    isBluetoothSupported() {
        // Check if running in secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
            console.warn('Web Bluetooth requires a secure context (HTTPS or localhost)');
            return false;
        }
        
        // Check if Web Bluetooth API is available
        if (!('bluetooth' in navigator)) {
            console.warn('Web Bluetooth API not available in this browser');
            return false;
        }
        
        // Check if requestDevice method is available
        if (!('requestDevice' in navigator.bluetooth)) {
            console.warn('navigator.bluetooth.requestDevice not available');
            return false;
        }
        
        return true;
    }

    /**
     * Get detailed browser support information
     */
    getBrowserSupportInfo() {
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(userAgent);
        const isOpera = /OPR/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        return {
            isSupported: this.isBluetoothSupported(),
            isSecureContext: window.isSecureContext,
            browser: {
                isChrome,
                isEdge,
                isOpera,
                isFirefox,
                isSafari,
                userAgent
            },
            recommendations: this.getSupportRecommendations()
        };
    }

    /**
     * Get browser-specific recommendations
     */
    getSupportRecommendations() {
        const userAgent = navigator.userAgent;
        
        if (/Firefox/.test(userAgent)) {
            return {
                message: 'Firefox does not support Web Bluetooth API',
                action: 'Please use Chrome, Edge, or Opera',
                canEnable: false
            };
        }
        
        if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
            return {
                message: 'Safari does not support Web Bluetooth API',
                action: 'Please use Chrome, Edge, or Opera',
                canEnable: false
            };
        }
        
        if (/Chrome/.test(userAgent)) {
            return {
                message: 'Chrome supports Web Bluetooth',
                action: 'Enable "Experimental Web Platform features" in chrome://flags',
                canEnable: true,
                steps: [
                    '1. Open chrome://flags in a new tab',
                    '2. Search for "Experimental Web Platform features"',
                    '3. Set it to "Enabled"',
                    '4. Restart Chrome'
                ]
            };
        }
        
        if (/Edg/.test(userAgent)) {
            return {
                message: 'Edge supports Web Bluetooth',
                action: 'Enable "Experimental Web Platform features" in edge://flags',
                canEnable: true,
                steps: [
                    '1. Open edge://flags in a new tab',
                    '2. Search for "Experimental Web Platform features"',
                    '3. Set it to "Enabled"',
                    '4. Restart Edge'
                ]
            };
        }
        
        return {
            message: 'Unknown browser compatibility',
            action: 'Please use Chrome, Edge, or Opera with Web Bluetooth enabled',
            canEnable: false
        };
    }

    /**
     * Scan and connect to a wearable device
     */
    async scanAndConnect(deviceType = 'fitness') {
        if (!this.isBluetoothSupported()) {
            throw new Error('Web Bluetooth is not supported in this browser');
        }

        try {
            console.log('Scanning for Bluetooth devices...');

            // Define device filters based on type
            const filters = this.getDeviceFilters(deviceType);

            // Request device with appropriate filters
            this.device = await navigator.bluetooth.requestDevice({
                filters: filters,
                optionalServices: Object.values(this.services)
            });

            console.log('Device selected:', this.device.name);

            // Connect to GATT server
            this.server = await this.device.gatt.connect();
            this.isConnected = true;

            // Set up disconnect handler
            this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

            // Discover and setup services
            await this.setupServices();

            return {
                success: true,
                device: {
                    id: this.device.id,
                    name: this.device.name,
                    type: deviceType,
                    connected: true
                }
            };

        } catch (error) {
            console.error('Bluetooth connection error:', error);
            throw new Error(`Failed to connect: ${error.message}`);
        }
    }

    /**
     * Get device filters for different wearable types
     */
    getDeviceFilters(deviceType) {
        const commonFilters = [
            { services: [this.services.HEART_RATE] },
            { services: [this.services.FITNESS_MACHINE] },
            { namePrefix: 'Fitbit' },
            { namePrefix: 'Garmin' },
            { namePrefix: 'Polar' },
            { namePrefix: 'Suunto' },
            { namePrefix: 'Wahoo' }
        ];

        switch (deviceType) {
            case 'heart_rate':
                return [{ services: [this.services.HEART_RATE] }];
            case 'fitness':
                return commonFilters;
            case 'cycling':
                return [
                    { services: [this.services.CYCLING_POWER] },
                    { services: [this.services.FITNESS_MACHINE] }
                ];
            default:
                return commonFilters;
        }
    }

    /**
     * Setup available services and characteristics
     */
    async setupServices() {
        try {
            // Get available services
            const services = await this.server.getPrimaryServices();

            for (const service of services) {
                console.log('Found service:', service.uuid);

                // Get characteristics for each service
                const characteristics = await service.getCharacteristics();

                for (const characteristic of characteristics) {
                    console.log('Found characteristic:', characteristic.uuid);
                    this.characteristics.set(characteristic.uuid, characteristic);

                    // Setup notifications for data characteristics
                    if (characteristic.properties.notify) {
                        await this.setupNotifications(characteristic);
                    }
                }
            }

        } catch (error) {
            console.error('Error setting up services:', error);
        }
    }

    /**
     * Setup notifications for real-time data
     */
    async setupNotifications(characteristic) {
        try {
            await characteristic.startNotifications();

            characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.handleCharacteristicChange(event);
            });

            console.log('Notifications enabled for:', characteristic.uuid);

        } catch (error) {
            console.error('Error setting up notifications:', error);
        }
    }

    /**
     * Handle incoming data from characteristics
     */
    handleCharacteristicChange(event) {
        const characteristic = event.target;
        const value = characteristic.value;

        let data = null;

        switch (characteristic.uuid) {
            case this.characteristics.HEART_RATE_MEASUREMENT:
                data = this.parseHeartRateData(value);
                break;
            case this.characteristics.BATTERY_LEVEL:
                data = this.parseBatteryData(value);
                break;
            default:
                data = this.parseGenericData(value);
        }

        if (data) {
            this.emitData(characteristic.uuid, data);
        }
    }

    /**
     * Parse heart rate measurement data
     */
    parseHeartRateData(value) {
        const flags = value.getUint8(0);
        const is16Bit = flags & 0x01;

        let heartRate;
        if (is16Bit) {
            heartRate = value.getUint16(1, true); // little endian
        } else {
            heartRate = value.getUint8(1);
        }

        return {
            type: 'heart_rate',
            bpm: heartRate,
            timestamp: new Date().toISOString(),
            confidence: 0.9, // Bluetooth data is generally reliable
            context: 'real_time'
        };
    }

    /**
     * Parse battery level data
     */
    parseBatteryData(value) {
        const batteryLevel = value.getUint8(0);

        return {
            type: 'battery',
            level: batteryLevel,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Parse generic sensor data
     */
    parseGenericData(value) {
        // Convert ArrayBuffer to array for generic parsing
        const data = new Uint8Array(value.buffer);

        return {
            type: 'generic',
            rawData: Array.from(data),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Emit data to listeners
     */
    emitData(characteristicUuid, data) {
        const listeners = this.listeners.get(characteristicUuid) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in data listener:', error);
            }
        });

        // Also emit to general data listeners
        const generalListeners = this.listeners.get('data') || [];
        generalListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in general data listener:', error);
            }
        });
    }

    /**
     * Add data listener
     */
    onData(callback, characteristicUuid = 'data') {
        if (!this.listeners.has(characteristicUuid)) {
            this.listeners.set(characteristicUuid, []);
        }
        this.listeners.get(characteristicUuid).push(callback);
    }

    /**
     * Remove data listener
     */
    offData(callback, characteristicUuid = 'data') {
        const listeners = this.listeners.get(characteristicUuid);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Read specific characteristic value
     */
    async readCharacteristic(characteristicUuid) {
        const characteristic = this.characteristics.get(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }

        try {
            const value = await characteristic.readValue();
            return this.parseCharacteristicValue(characteristicUuid, value);
        } catch (error) {
            console.error('Error reading characteristic:', error);
            throw error;
        }
    }

    /**
     * Write to characteristic
     */
    async writeCharacteristic(characteristicUuid, data) {
        const characteristic = this.characteristics.get(characteristicUuid);
        if (!characteristic) {
            throw new Error(`Characteristic ${characteristicUuid} not found`);
        }

        try {
            await characteristic.writeValue(data);
            return true;
        } catch (error) {
            console.error('Error writing characteristic:', error);
            throw error;
        }
    }

    /**
     * Get device information
     */
    async getDeviceInfo() {
        if (!this.isConnected) {
            throw new Error('Device not connected');
        }

        const info = {
            id: this.device.id,
            name: this.device.name,
            connected: this.isConnected
        };

        try {
            // Try to read device name
            const deviceName = await this.readCharacteristic(this.characteristics.DEVICE_NAME);
            if (deviceName) info.deviceName = deviceName;

            // Try to read manufacturer
            const manufacturer = await this.readCharacteristic(this.characteristics.MANUFACTURER_NAME);
            if (manufacturer) info.manufacturer = manufacturer;

            // Try to read battery level
            const battery = await this.readCharacteristic(this.characteristics.BATTERY_LEVEL);
            if (battery) info.batteryLevel = battery;

        } catch (error) {
            console.log('Some device info not available:', error.message);
        }

        return info;
    }

    /**
     * Parse characteristic value based on type
     */
    parseCharacteristicValue(characteristicUuid, value) {
        switch (characteristicUuid) {
            case this.characteristics.HEART_RATE_MEASUREMENT:
                return this.parseHeartRateData(value);
            case this.characteristics.BATTERY_LEVEL:
                return value.getUint8(0);
            case this.characteristics.DEVICE_NAME:
            case this.characteristics.MANUFACTURER_NAME:
                return new TextDecoder().decode(value);
            default:
                return this.parseGenericData(value);
        }
    }

    /**
     * Handle device disconnection
     */
    onDisconnected() {
        console.log('Device disconnected');
        this.isConnected = false;
        this.server = null;
        this.characteristics.clear();

        // Emit disconnect event
        this.emitData('disconnect', { timestamp: new Date().toISOString() });
    }

    /**
     * Manually disconnect device
     */
    async disconnect() {
        if (this.server && this.isConnected) {
            await this.server.disconnect();
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            device: this.device ? {
                id: this.device.id,
                name: this.device.name
            } : null
        };
    }
}

export default BluetoothService;