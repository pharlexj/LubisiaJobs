import { FileText, ClipboardList, Settings, History, CheckCircle2, Users } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

export function AppSidebar() {
  const [location] = useLocation();
  const { isOfficer, isReviewer, isAuditor, isAdmin } = useAuth();

  const officerItems = [
    {
      title: "My Declarations",
      url: "/",
      icon: FileText,
    },
    {
      title: "New Declaration",
      url: "/dial/new",
      icon: ClipboardList,
    },
  ];

  const reviewerItems = [
    {
      title: "Review Queue",
      url: "/review",
      icon: CheckCircle2,
    },
    {
      title: "All Declarations",
      url: "/declarations",
      icon: FileText,
    },
  ];

  const auditorItems = [
    {
      title: "Audit Logs",
      url: "/audit",
      icon: History,
    },
    {
      title: "All Declarations",
      url: "/declarations",
      icon: FileText,
    },
  ];

  const adminItems = [
    {
      title: "Review Queue",
      url: "/review",
      icon: CheckCircle2,
    },
    {
      title: "All Declarations",
      url: "/declarations",
      icon: FileText,
    },
    {
      title: "Users",
      url: "/users",
      icon: Users,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  let items = officerItems;
  if (isReviewer) items = reviewerItems;
  if (isAuditor) items = auditorItems;
  if (isAdmin) items = adminItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">DIAL System</h2>
            <p className="text-xs text-muted-foreground">Declaration Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
