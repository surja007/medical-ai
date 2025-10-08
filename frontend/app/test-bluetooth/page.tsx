'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bluetooth, 
  BluetoothConnected, 
  Heart, 
  Battery,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import BluetoothService from '@/lib/bluetooth/BluetoothService';
import BluetoothBrowserSupport from '@/components/wearables/BluetoothBrowserSupport';

const TestBluetoothPage = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState<any>(null);
  const [data, setData] = useState<any>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [bluetoothService] = useState(() => new BluetoothService());

  React.useEffect(() => {
    setIsSupported(bluetoothService.isBluetoothSupported());
    
    bluetoothService.onData((receivedData) => {
      addLog(`Data received: ${receivedData.type} = ${JSON.stringify(receivedData)}`);
      setData(prev => ({ ...prev, [receivedData.type]: receivedData }));
    });
  }, [bluetoothService]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  const handleConnect = async () => {
    try {
      addLog('Starting Bluetooth scan...');
      const result = await bluetoothService.scanAndConnect('fitness');
      
      if (result.success) {
        setIsConnected(true);
        setDevice(result.device);
        addLog(`Connected to ${result.device.name}`);
        
        const deviceInfo = await bluetoothService.getDeviceInfo();
        addLog(`Device info: ${JSON.stringify(deviceInfo)}`);
      }
    } catch (error: any) {
      addLog(`Connection failed: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothService.disconnect();
      setIsConnected(false);
      setDevice(null);
      setData({});
      addLog('Disconnected');
    } catch (error: any) {
      addLog(`Disconnect failed: ${error.message}`);
    }
  };

  const simulateData = () => {
    const mockData = {
      type: 'heart_rate',
      bpm: 70 + Math.floor(Math.random() * 30),
      timestamp: new Date().toISOString()
    };
    addLog(`Simulating data: ${JSON.stringify(mockData)}`);
    setData(prev => ({ ...prev, [mockData.type]: mockData }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Bluetooth Test Page</h1>
        <p className="text-gray-600">Test Bluetooth connectivity with your wearable devices</p>
      </div>

      {/* Browser Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bluetooth className="h-5 w-5" />
            Browser Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSupported ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">Web Bluetooth is supported!</span>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Web Bluetooth is not supported. Please use Chrome, Edge, or Opera.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Connection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={handleConnect}
                disabled={!isSupported}
                className="flex items-center gap-2"
              >
                <Bluetooth className="h-4 w-4" />
                Connect Device
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <BluetoothConnected className="h-4 w-4" />
                Disconnect
              </Button>
            )}
            
            <Button onClick={simulateData} variant="outline">
              Simulate Data
            </Button>
          </div>

          {device && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-gray-600">ID: {device.id}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  <BluetoothConnected className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Data */}
      {Object.keys(data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.heart_rate && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Heart Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {data.heart_rate.bpm} BPM
                  </p>
                </div>
              )}

              {data.battery && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Battery</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {data.battery.level}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <p key={index} className="text-xs font-mono text-gray-700 mb-1">
                  {log}
                </p>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No logs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestBluetoothPage;