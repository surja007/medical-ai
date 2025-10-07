'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Heart, Activity, Users } from 'lucide-react'

export default function TestWearablesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Wearables Components Test
        </h1>

        {/* Test Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Heart Rate</h3>
                <p className="text-2xl font-bold text-gray-900">72 BPM</p>
                <Badge className="bg-green-100 text-green-800">Normal</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Steps</h3>
                <p className="text-2xl font-bold text-gray-900">8,542</p>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Family</h3>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <Badge className="bg-purple-100 text-purple-800">Connected</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Test Tabs */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Tabs Test</h2>
          <Tabs defaultValue="devices" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="health">Health</TabsTrigger>
              <TabsTrigger value="family">Family</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4">
              <p className="text-gray-600">Device management content would go here.</p>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <p className="text-gray-600">Health metrics content would go here.</p>
            </TabsContent>

            <TabsContent value="family" className="space-y-4">
              <p className="text-gray-600">Family monitoring content would go here.</p>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Test Form Elements */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Elements Test</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-input">Test Input</Label>
              <Input id="test-input" placeholder="Enter some text..." />
            </div>
            
            <div>
              <Label htmlFor="test-textarea">Test Textarea</Label>
              <Textarea id="test-textarea" placeholder="Enter some longer text..." />
            </div>
            
            <Button>Test Button</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}