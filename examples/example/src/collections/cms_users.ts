import { EntityCollection } from "@firecms/core";

export type CMSUser = {
    email: string;
    name: string;
    roles: string[];
    created_on?: Date;
};

export const cmsUsersCollection: EntityCollection<CMSUser> = {
    id: "cms_users",
    name: "CMS Users",
    path: "cms_users",
    group: "Admin",
    icon: "Face",
    description: "Manage CMS users and their roles",
    properties: {
        email: {
            dataType: "string",
            name: "Email",
            validation: { required: true }
        },
        name: {
            dataType: "string",
            name: "Name",
            validation: { required: true }
        },
        roles: {
            dataType: "array",
            name: "Roles",
            of: {
                dataType: "string"
            }
        },
        created_on: {
            dataType: "date",
            name: "Created on"
        }
    }
};
