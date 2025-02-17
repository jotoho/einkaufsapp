#!/usr/bin/env python3
#
# SPDX-License-Identifier: AGPL-3.0-only
# SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

from appwrite.client import Client
from appwrite.query import Query
from appwrite.services.teams import Teams
from appwrite.services.users import Users


def main(context):
    context.log()
    client = (Client().set_endpoint(environ["APPWRITE_FUNCTION_API_ENDPOINT"])
              .set_project(environ["APPWRITE_FUNCTION_PROJECT_ID"])
              .set_key(context.req.headers["x-appwrite-key"]))
    teams = Teams(client)
    users = Users(client)
    if context.req.content_type == "application/json":
        team_id = context.req.body_json["team_id"]
        invitee_email = context.req.body_json["invitee_email"]
        if team_id is None or invitee_email is None:
            context.res.status_code(400)
            return context.res.empty()
        user_candidates = users.list(queries=[
            Query.equal("email", [invitee_email])
        ]).users
        requested_team = teams.get(team_id)
        authenticated_inviter = teams.list_memberships(team_id=team_id,
                                                       queries=[
                                                           Query.equals(
                                                               "confirm", [true]),
                                                           Query.equals(
                                                               "userId", [context.req.headers["x-appwrite-user-id"]])
                                                       ]).total == 1
        if authenticated_inviter:
            teams.create_membership(team_id, roles=["owner"], user_id=user_candidates[0])
            return context.res.empty()

    context.res.status_code(400)
    return context.res.empty()
