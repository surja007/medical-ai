'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Chrome, 
  Info,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';
import BluetoothService from '@/lib/bluetooth/BluetoothService';

const BluetoothBrowserSupport = () => {
  const [supportInfo, setSupportInfo] = useState<any>(null);
  const [bluetoothService] = useState(() => new BluetoothService());

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = () => {
    const info = bluetoothService.getBrowserSupportInfo();
    setSupportInfo(info);
    console.log('Browser Support Info:', info);
  };

  const openChromeFlags = () => {
    window.open('chrome://flags/#enable-experimental-web-platform-features', '_blank');
  };

  const openEdgeFlags = () => {
    window.open('edge://flags/#enable-experimental-web-platform-features', '_blank');
  };

  if (!supportInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Checking browser support...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Support Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {supportInfo.isSupported ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Web Bluetooth Support
          </CardTitle>
          <CardDescription>
            Browser compatibility check for Bluetooth connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Bluetooth API</p>
              <Badge variant={supportInfo.isSupported ? "default" : "destructive"}>
                {supportInfo.isSupported ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Secure Context</p>
              <Badge variant={supportInfo.isSecureContext ? "default" : "destructive"}>
                {supportInfo.isSecureContext ? 'HTTPS/Localhost' : 'Insecure'}
              </Badge>
            </div>
          </div>

          <Button onClick={checkSupport} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recheck Support
          </Button>
        </CardContent>
      </Card>

      {/* Browser Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Browser Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {supportInfo.browser.isChrome && (
              <div className="flex items-center gap-2">
                <Chrome className="h-4 w-4" />
                <span className="text-sm">Google Chrome</span>
                <Badge variant="default">Supported</Badge>
              </div>
            )}
            {supportInfo.browser.isEdge && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Microsoft Edge</span>
                <Badge variant="default">Supported</Badge>
              </div>
            )}
            {supportInfo.browser.isOpera && (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Opera</span>
                <Badge variant="default">Supported</Badge>
              </div>
            )}
            {supportInfo.browser.isFirefox && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Firefox</span>
                <Badge variant="destructive">Not Supported</Badge>
              </div>
            )}
            {supportInfo.browser.isSafari && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Safari</span>
                <Badge variant="destructive">Not Supported</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {!supportInfo.isSupported && (
        <Alert variant={supportInfo.recommendations.canEnable ? "default" : "destructive"}>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <strong>{supportInfo.recommendations.message}</strong>
                <p className="text-sm mt-1">{supportInfo.recommendations.action}</p>
              </div>

              {supportInfo.recommendations.steps && (
                <div>
                  <p className="text-sm font-medium mb-2">Setup Instructions:</p>
                  <ol className="text-sm space-y-1 ml-4">
                    {supportInfo.recommendations.steps.map((step: string, index: number) => (
                      <li key={index} className="list-decimal">{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex gap-2">
                {supportInfo.browser.isChrome && (
                  <Button onClick={openChromeFlags} size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Chrome Flags
                  </Button>
                )}
                {supportInfo.browser.isEdge && (
                  <Button onClick={openEdgeFlags} size="sm" variant="outline">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open Edge Flags
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {supportInfo.isSupported && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Great!</strong> Your browser supports Web Bluetooth. You can now connect to Bluetooth devices directly from your browser.
          </AlertDescription>
        </Alert>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Troubleshooting Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="space-y-1">
            <p><strong>If Bluetooth isn't working:</strong></p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Make sure Bluetooth is enabled in your system settings</li>
              <li>Ensure you're using HTTPS or localhost (required for security)</li>
              <li>Try refreshing the page after enabling browser flags</li>
              <li>Put your device in pairing/discoverable mode</li>
              <li>Check that no other apps are connected to your device</li>
            </ul>
          </div>
          
          <div className="space-y-1 mt-4">
            <p><strong>Supported Devices:</strong></p>
            <ul className="list-disc ml-4 space-y-1">
              <li>Fitness trackers with Bluetooth LE (BLE)</li>
              <li>Heart rate monitors (chest straps, wrist-based)</li>
              <li>Smartwatches with standard health services</li>
              <li>Custom IoT health sensors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BluetoothBrowserSupport;