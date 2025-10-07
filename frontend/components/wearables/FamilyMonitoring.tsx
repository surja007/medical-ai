'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Users, 
  Plus, 
  Settings, 
  Heart,
  Activity,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  Crown,
  Shield
} from 'lucide-react'

interface FamilyMonitoringProps {
  familyGroups: any[]
  onRefresh: () => void
}

export default function FamilyMonitoring({ familyGroups, onRefresh }: FamilyMonitoringProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('other')
  const [loading, setLoading] = useState(false)

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return

    setLoading(true)
    try {
      const { familyAPI } = await import('@/lib/api')
      await familyAPI.createFamilyGroup({
        name: groupName,
        description: groupDescription
      })
      
      setShowCreateGroup(false)
      setGroupName('')
      setGroupDescription('')
      onRefresh()
    } catch (error) {
      console.error('Failed to create family group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim() || !selectedGroup) return

    setLoading(true)
    try {
      const { familyAPI } = await import('@/lib/api')
      await familyAPI.inviteFamilyMember(selectedGroup._id, {
        email: inviteEmail,
        role: inviteRole
      })
      
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('other')
      setSelectedGroup(null)
      onRefresh()
    } catch (error) {
      console.error('Failed to invite family member:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-600" />
      case 'parent':
      case 'guardian':
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <Users className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800'
      case 'parent':
      case 'guardian':
        return 'bg-blue-100 text-blue-800'
      case 'spouse':
        return 'bg-purple-100 text-purple-800'
      case 'child':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthStatus = (member: any) => {
    // Mock health status - in real app, this would come from recent health data
    const statuses = ['normal', 'warning', 'critical']
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    
    switch (randomStatus) {
      case 'normal':
        return { color: 'text-green-600', bg: 'bg-green-100', text: 'Normal' }
      case 'warning':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Attention' }
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100', text: 'Critical' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: 'Unknown' }
    }
  }

  if (familyGroups.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Family Groups
          </h3>
          <p className="text-gray-600 mb-6">
            Create a family group to monitor health data across your family members
          </p>
          <Button onClick={() => setShowCreateGroup(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Family Group
          </Button>
        </Card>

        {/* Create Group Modal */}
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Family Group</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Smith Family"
                />
              </div>
              
              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Input
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Family health monitoring group"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateGroup(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  disabled={loading || !groupName.trim()}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Family Monitoring</h2>
        <Button onClick={() => setShowCreateGroup(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Family Groups */}
      <div className="space-y-6">
        {familyGroups.map((group) => (
          <Card key={group._id} className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {group.name}
                </h3>
                {group.description && (
                  <p className="text-gray-600">{group.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>{group.activeMembersCount} members</span>
                  <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedGroup(group)
                    setShowInviteModal(true)
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Family Members */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Family Members</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {group.members?.map((member: any) => {
                  const healthStatus = getHealthStatus(member)
                  
                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {member.user?.firstName?.[0]}{member.user?.lastName?.[0]}
                          </span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {member.user?.firstName} {member.user?.lastName}
                            </span>
                            {getRoleIcon(member.role)}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {member.role}
                            </Badge>
                            
                            <Badge className={`${healthStatus.bg} ${healthStatus.color}`}>
                              {healthStatus.text}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Quick Health Stats */}
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>72</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span>8.2k</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pending Invitations */}
              {group.invitations?.filter((inv: any) => inv.status === 'pending').length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-2">Pending Invitations</h5>
                  <div className="space-y-2">
                    {group.invitations
                      .filter((inv: any) => inv.status === 'pending')
                      .map((invitation: any) => (
                        <div
                          key={invitation._id}
                          className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-900">
                              {invitation.email}
                            </span>
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                              {invitation.role}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-yellow-600">
                            Pending
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Invite Member Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Family Member</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="family.member@email.com"
              />
            </div>
            
            <div>
              <Label htmlFor="inviteRole">Family Role</Label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="parent">Parent</option>
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="sibling">Sibling</option>
                <option value="grandparent">Grandparent</option>
                <option value="guardian">Guardian</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowInviteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteMember}
                disabled={loading || !inviteEmail.trim()}
                className="flex-1"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group Modal */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Family Group</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Smith Family"
              />
            </div>
            
            <div>
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Input
                id="groupDescription"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Family health monitoring group"
              />
            </div>
            
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateGroup(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim()}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}