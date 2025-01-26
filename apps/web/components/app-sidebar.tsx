import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter
} from "@workspace/ui/components/sidebar";
import { Home, Search, Settings, LogOut } from "lucide-react"
import { SignOutButton } from "@clerk/nextjs";
import { currentUser } from '@clerk/nextjs/server'
import { Separator } from "@workspace/ui/components/separator";
import {Button} from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";


// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

const projects = [
    {
        title: "Untitled Project",
        url: "#",
    },
]

export async function AppSidebar() {

    const user = await currentUser();

    return (
        <Sidebar>
            <SidebarHeader>
                {
                    user ? (
                        <div className={'flex gap-2 items-center'}>
                            <Avatar className={'h-8 w-8'}>
                                <AvatarImage src={user.imageUrl} />
                                <AvatarFallback>{`${user.firstName?.[0]}${user.lastName?.[0]}`}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className={'text-sm font-medium'}>{user?.firstName} {user?.lastName}</p>
                                <p className={'text-xs truncate'}>{user?.emailAddresses?.[0]?.emailAddress}</p>
                            </div>
                        </div>
                    ) : (
                        <Skeleton className={'h-10'} />
                    )
                }
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects.map((project) => (
                                <SidebarMenuItem key={project.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={project.url}>
                                            <span>{project.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SignOutButton>
                    <Button>
                        <LogOut size={16}/>
                        <span>Logout</span>
                    </Button>
                </SignOutButton>
            </SidebarFooter>
        </Sidebar>
    )
}