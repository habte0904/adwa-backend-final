import React from "react"
import {
  Home,
  Ticket,
  Users,
  Clock,
  Megaphone,
  Settings,
  BarChart3,
  UserCheck,
  QrCode,
  CreditCard,
  Bell,
  FileText,
  MapPin,
  LogOut,
  User,
  Shield,
  ChevronDown,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

// ... roleNavigation, roleColors, roleLabels from your original code
const roleNavigation = {
  ticket_operator: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Tickets",
      icon: Ticket,
      items: [
       { title: "Daily Dashboard", url: "/tickets", icon: BarChart3 },
        { title: "Walk-in Registration", url: "/tickets/walk-in", icon: UserCheck },
        { title: "Ticket Validation", url: "/tickets/validation", icon: QrCode },
        { title: "Lost Tickets", url: "/tickets/lost", icon: FileText },
        { title: "Cancellations", url: "/tickets/cancellations", icon: CreditCard },
      ],
    },
    {
      title: "Schedule",
      url: "/schedule",
      icon: Clock,
    },
  ],
}


export function RoleBasedSidebar(props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, switchRole } = useAuth()

  if (!user) {
    navigate("/login")
    return null
  }

  const pathname = location.pathname
  const navigation = roleNavigation[user.role] || []

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${roleColors[user.role]} text-white`}>
            <Home className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">Staff Portal</span>
            <span className="truncate text-xs">{roleLabels[user.role]}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <Collapsible defaultOpen className="group/collapsible">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                                <Link to={subItem.url}>
                                  <subItem.icon />
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}//navigation map emds
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="w-full">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className={`${roleColors[user.role]} text-white text-xs`}>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.department}</span>
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {roleLabels[user.role]}
                  </Badge>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1 text-xs text-muted-foreground">Switch Role (Admin)</div>
                    {Object.entries(roleLabels).map(([role, label]) => (
                      <DropdownMenuItem key={role} onClick={() => switchRole(role)}>
                        <div className={`mr-2 h-3 w-3 rounded ${roleColors[role]}`} />
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <D
