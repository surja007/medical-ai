'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bluetooth, 
  BluetoothConnected, 
  Heart, 
  Battery, 
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import BluetoothService from '@/lib/bluetooth/BluetoothService';

interface BluetoothConnectorProps {
  onDataReceived?: (data: any) => void;
  onDeviceConnected?: (device: any) => void;
  onDeviceDisconnected?: () => void;
}

interface DeviceData {
  heartRate?: number;
  batteryLevel?: number;
  steps?: number;
  lastUpdate?: string;
}

const BluetoothConnector: React.FC<BluetoothConnectorProps> = ({
  onDataReceived,
  onDeviceConnected,
  onDeviceDisconnected
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [deviceData, setDeviceData] = useState<DeviceData>({});
  const [error, setError] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  
  const bluetoothService = useRef<BluetoothService | null>(null);

  useEffect(() => {
    // Initialize Bluetooth service
    bluetoothService.current = new BluetoothService();
    setIsSupported(bluetoothService.current.isBluetoothSupported());

    // Setup data listeners
    if (bluetoothService.current) {
      bluetoothService.current.onData((data) => {
        handleDataReceived(data);
      });

      bluetoothService.current.onData((data) => {
        if (data.type === 'disconnect') {
          handleDisconnect();
        }
      }, 'disconnect');
    }

    return () => {
      if (bluetoothService.current && isConnected) {
        bluetoothService.current.disconnect();
      }
    };
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const handleConnect = async (deviceType: string = 'fitness') => {
    if (!bluetoothService.current) return;

    setIsConnecting(true);
    setError('');
    addLog(`Scanning for ${deviceType} devices...`);

    try {
      const result = await bluetoothService.current.scanAndConnect(deviceType);
      
      if (result.success) {
        setIsConnected(true);
        setDevice(result.device);
        addLog(`Connected to ${result.device.name}`);
        
        // Get device info
        const deviceInfo = await bluetoothService.current.getDeviceInfo();
        setDevice(prev => ({ ...prev, ...deviceInfo }));
        
        onDeviceConnected?.(result.device);
      }
    } catch (err: any) {
      setError(err.message);
      addLog(`Connection failed: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!bluetoothService.current) return;

    try {
      await bluetoothService.current.disconnect();
      setIsConnected(false);
      setDevice(null);
      setDeviceData({});
      addLog('Device disconnected');
      onDeviceDisconnected?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDataReceived = (data: any) => {
    addLog(`Received ${data.type}: ${JSON.stringify(data)}`);
    
    // Update device data based on type
    setDeviceData(prev => {
      const updated = { ...prev, lastUpdate: new Date().toLocaleTimeString() };
      
      switch (data.type) {
        case 'heart_rate':
          updated.heartRate = data.bpm;
          break;
        case 'battery':
          updated.batteryLevel = data.level;
          break;
        case 'steps':
          updated.steps = data.count;
          break;
      }
      
      return updated;
    });

    // Send data to parent component and backend
    onDataReceived?.(data);
    sendDataToBackend(data);
  };

  const sendDataToBackend = async (data: any) => {
    if (!device) return;

    try {
      const response = await fetch('/api/wearables/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deviceId: device.id,
          deviceType: 'bluetooth_' + (device.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'),
          dataType: data.type,
          data: data
        })
      });

      if (response.ok) {
        addLog(`Data sent to backend: ${data.type}`);
      } else {
        addLog(`Failed to send data: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
      addLog(`Backend error: ${error}`);
    }
  };

  const readBatteryLevel = async () => {
    if (!bluetoothService.current || !isConnected) return;

    try {
      const batteryLevel = await bluetoothService.current.readCharacteristic(
        bluetoothService.current.characteristics.BATTERY_LEVEL
      );
      addLog(`Battery level: ${batteryLevel}%`);
      setDeviceData(prev => ({ ...prev, batteryLevel }));
    } catch (error) {
      addLog(`Failed to read battery: ${error}`);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Bluetooth Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <BluetoothConnected className="h-5 w-5 text-blue-500" />
            ) : (
              <Bluetooth className="h-5 w-5" />
            )}
            Bluetooth Wearable Connection
          </CardTitle>
          <CardDescription>
            Connect directly to your fitness tracker or smartwatch via Bluetooth
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isConnected ? (
              <>
                <Button 
                  onClick={() => handleConnect('fitness')}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bluetooth className="h-4 w-4" />
                  )}
                  {isConnecting ? 'Scanning...' : 'Connect Fitness Tracker'}
                </Button>
                
                <Button 
                  onClick={() => handleConnect('heart_rate')}
                  disabled={isConnecting}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Heart Rate Monitor
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Bluetooth className="h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>

          {isConnected && device && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">{device.name || 'Unknown Device'}</p>
                  <p className="text-sm text-gray-600">ID: {device.id}</p>
                  {device.manufacturer && (
                    <p className="text-sm text-gray-600">Manufacturer: {device.manufacturer}</p>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>

              {/* Real-time Data Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {deviceData.heartRate && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Heart Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {deviceData.heartRate} <span className="text-sm">BPM</span>
                    </p>
                  </div>
                )}

                {deviceData.batteryLevel !== undefined && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Battery</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {deviceData.batteryLevel}%
                    </p>
                  </div>
                )}

                {deviceData.steps && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Steps</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {deviceData.steps.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {deviceData.lastUpdate && (
                <p className="text-xs text-gray-500">
                  Last update: {deviceData.lastUpdate}
                </p>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={readBatteryLevel}
                  variant="outline"
                  size="sm"
                >
                  Read Battery
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Connection Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <p key={index} className="text-xs font-mono text-gray-700">
                  {log}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BluetoothConnector;