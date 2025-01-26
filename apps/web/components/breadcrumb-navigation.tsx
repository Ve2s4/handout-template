'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from '@workspace/ui/components/breadcrumb';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';

export function BreadcrumbNavigation() {
    const pathName = usePathname();
    const router = useRouter();

    const elements: string[] = pathName.split('/').filter(Boolean);

    const dropdownElements = elements.slice(1, elements.length - 1);

    const lastElement = elements[elements.length - 1];

    function handleRedirect(route: string | undefined) {
        router.push(route ?? "");
    }

    return (
        <Breadcrumb>
            <BreadcrumbList className={'cursor-pointer'}>
                <BreadcrumbItem>
                    <BreadcrumbLink onClick={() => handleRedirect('/')}>Home</BreadcrumbLink>
                </BreadcrumbItem>
                {lastElement && <BreadcrumbSeparator />}
                {dropdownElements.length > 0 && (
                    <>
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1">
                                    <BreadcrumbEllipsis className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {dropdownElements.map((element, index) => (
                                        <DropdownMenuItem
                                            key={index}
                                            onClick={() => handleRedirect(`/${element}`)}
                                            className={'capitalize'}
                                        >
                                            {element}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                    </>
                )}
                <BreadcrumbItem>
                    <BreadcrumbPage
                        onClick={() => handleRedirect(lastElement)}
                        className={'capitalize'}
                    >
                        {lastElement}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    );
}