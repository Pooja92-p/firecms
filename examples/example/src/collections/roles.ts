import { EntityCollection } from "@firecms/core";

export type Role = {
    name: string;
    isAdmin: boolean;
    permissions: string[]; // e.g. ["Create", "Read", "Update", "Delete"]
};

export const rolesCollection: EntityCollection<Role> = {
    id: "roles",
    name: "Roles",
    path: "roles",
    group: "Admin",
    icon: "Security",
    description: "Manage user roles and permissions",
    properties: {
        name: {
            dataType: "string",
            name: "Role",
            validation: { required: true }
        },
        isAdmin: {
            dataType: "boolean",
            name: "Is Admin"
        },
        permissions: {
            dataType: "array",
            name: "Default permissions",
            of: {
                dataType: "string",
                enumValues: [
                    { id: "Create", label: "Create" },
                    { id: "Read", label: "Read" },
                    { id: "Update", label: "Update" },
                    { id: "Delete", label: "Delete" }
                ]
            }
        }
    }
};
