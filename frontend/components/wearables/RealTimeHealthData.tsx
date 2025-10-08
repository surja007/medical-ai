'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Activity, 
  Battery, 
  Thermometer,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  BluetoothConnected,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import BluetoothService from '@/lib/bluetooth/BluetoothService';

interface RealTimeHealthDataProps {
  deviceId?: string;
  onDataReceived?: (data: any) => void;
}

interface BluetoothData {
  type: string;
  bpm?: number;
  count?: number;
  steps?: number;
  level?: number;
  batteryLevel?: number;
  celsius?: number;
  temperature?: number;
  percentage?: number;
  spo2?: number;
  isCharging?: boolean;
  timestamp?: string;
}

interface HealthMetrics {
  heartRate?: {
    value: number;
    timestamp: string;
    trend: 'up' | 'down' | 'stable';
  };
  steps?: {
    value: number;
    timestamp: string;
  };
  battery?: {
    value: number;
    timestamp: string;
    isCharging?: boolean;
  };
  temperature?: {
    value: number;
    timestamp: string;
  };
  oxygenSaturation?: {
    value: number;
    timestamp: string;
  };
}

const RealTimeHealthData: React.FC<RealTimeHealthDataProps> = ({
  deviceId,
  onDataReceived
}) => {
  const [metrics, setMetrics] = useState<HealthMetrics>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  
  const bluetoothService = useRef<BluetoothService | null>(null);
  const previousHeartRate = useRef<number | null>(null);

  useEffect(() => {
    // Initialize Bluetooth service if not already done
    if (!bluetoothService.current) {
      bluetoothService.current = new BluetoothService();
    }

    // Setup data listeners
    const handleData = (data: any) => {
      const timestamp = new Date().toLocaleTimeString();
      setLastUpdate(timestamp);
      
      // Update metrics based on data type
      setMetrics(prev => {
        const updated = { ...prev };
        
        switch (data.type) {
          case 'heart_rate':
            const trend = previousHeartRate.current 
              ? (data.bpm > previousHeartRate.current ? 'up' : 
                 data.bpm < previousHeartRate.current ? 'down' : 'stable')
              : 'stable';
            
            updated.heartRate = {
              value: data.bpm,
              timestamp,
              trend
            };
            previousHeartRate.current = data.bpm;
            break;
            
          case 'steps':
            updated.steps = {
              value: data.count || data.steps,
              timestamp
            };
            break;
            
          case 'battery':
            updated.battery = {
              value: data.level || data.batteryLevel,
              timestamp,
              isCharging: data.isCharging
            };
            break;
            
          case 'temperature':
            updated.temperature = {
              value: data.celsius || data.temperature,
              timestamp
            };
            break;
            
          case 'oxygen_saturation':
            updated.oxygenSaturation = {
              value: data.percentage || data.spo2,
              timestamp
            };
            break;
        }
        
        return updated;
      });

      // Add to history
      setDataHistory(prev => [
        {
          id: Date.now(),
          type: data.type,
          value: getDataDisplayValue(data),
          timestamp,
          rawData: data
        },
        ...prev.slice(0, 9) // Keep last 10 entries
      ]);

      // Send to parent component
      onDataReceived?.(data);
      
      // Send to backend
      sendDataToBackend(data);
    };

    if (bluetoothService.current) {
      bluetoothService.current.onData(handleData);
      
      // Check connection status
      const status = bluetoothService.current.getConnectionStatus();
      setIsConnected(status.connected);
      setConnectionStatus(status.connected ? 'connected' : 'disconnected');
    }

    return () => {
      if (bluetoothService.current) {
        bluetoothService.current.offData(handleData);
      }
    };
  }, [deviceId, onDataReceived]);

  const getDataDisplayValue = (data: BluetoothData) => {
    switch (data.type) {
      case 'heart_rate':
        return `${data.bpm} BPM`;
      case 'steps':
        return `${(data.count || data.steps).toLocaleString()} steps`;
      case 'battery':
        return `${data.level || data.batteryLevel}%`;
      case 'temperature':
        return `${(data.celsius || data.temperature).toFixed(1)}°C`;
      case 'oxygen_saturation':
        return `${data.percentage || data.spo2}%`;
      default:
        return JSON.stringify(data);
    }
  };

  const sendDataToBackend = async (data: BluetoothData) => {
    if (!deviceId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wearables/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          deviceId,
          deviceType: 'bluetooth_device',
          dataType: data.type,
          data: data,
          connectionType: 'bluetooth'
        })
      });

      if (!response.ok) {
        console.error('Failed to send data to backend:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getHealthStatus = (type: string, value: number) => {
    switch (type) {
      case 'heart_rate':
        if (value < 60) return { status: 'low', color: 'text-blue-600' };
        if (value > 100) return { status: 'high', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      case 'temperature':
        if (value < 36) return { status: 'low', color: 'text-blue-600' };
        if (value > 37.5) return { status: 'high', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      case 'oxygen_saturation':
        if (value < 95) return { status: 'low', color: 'text-red-600' };
        return { status: 'normal', color: 'text-green-600' };
      default:
        return { status: 'normal', color: 'text-gray-600' };
    }
  };

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Health Data
          </CardTitle>
          <CardDescription>
            Connect a Bluetooth device to see live health metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BluetoothConnected className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No Bluetooth device connected</p>
            <p className="text-sm text-gray-400">
              Use the "Connect Device" button to add a Bluetooth wearable
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BluetoothConnected className="h-5 w-5 text-blue-500" />
              Real-time Health Data
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>
          {lastUpdate && (
            <CardDescription>
              Last update: {lastUpdate}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Heart Rate */}
        {metrics.heartRate && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Heart Rate
                </div>
                {getTrendIcon(metrics.heartRate.trend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthStatus('heart_rate', metrics.heartRate.value).color}`}>
                {metrics.heartRate.value} BPM
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.heartRate.timestamp}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        {metrics.steps && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {metrics.steps.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.steps.timestamp}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Battery */}
        {metrics.battery && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Battery className="h-4 w-4 text-blue-500" />
                Device Battery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {metrics.battery.value}%
              </div>
              {metrics.battery.isCharging && (
                <Badge variant="outline" className="mt-1">
                  Charging
                </Badge>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {metrics.battery.timestamp}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Temperature */}
        {metrics.temperature && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                Temperature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthStatus('temperature', metrics.temperature.value).color}`}>
                {metrics.temperature.value.toFixed(1)}°C
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.temperature.timestamp}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Oxygen Saturation */}
        {metrics.oxygenSaturation && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />
                SpO2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthStatus('oxygen_saturation', metrics.oxygenSaturation.value).color}`}>
                {metrics.oxygenSaturation.value}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.oxygenSaturation.timestamp}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Health Alerts */}
      {(metrics.heartRate?.value && (metrics.heartRate.value < 60 || metrics.heartRate.value > 100)) ||
       (metrics.temperature?.value && (metrics.temperature.value < 36 || metrics.temperature.value > 37.5)) ||
       (metrics.oxygenSaturation?.value && metrics.oxygenSaturation.value < 95) ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Health Alert:</strong> Some readings are outside normal ranges. 
            Consider consulting with a healthcare provider if symptoms persist.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Data History */}
      {dataHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {dataHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {entry.type.replace('_', ' ')}
                    </Badge>
                    <span>{entry.value}</span>
                  </div>
                  <span className="text-xs text-gray-500">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeHealthData;