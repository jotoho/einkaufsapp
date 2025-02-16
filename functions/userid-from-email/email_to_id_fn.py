"""
  SPDX-License-Identifier: AGPL-3.0-only
  SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>
"""
#!/usr/bin/env python3

from os import environ
from appwrite.client import Client
from appwrite.query import Query
from appwrite.services.users import Users


def main(context) -> None:
    """
    This function is intended to allow clients to search for users by their reqistered email address
    """
    client = (Client().set_endpoint(environ["APPWRITE_FUNCTION_API_ENDPOINT"])
              .set_project(environ["APPWRITE_FUNCTION_PROJECT_ID"])
              .set_key(context.req.headers["x-appwrite-key"]))
    users = Users(client)
    target_list = users.list(
        queries=[Query.equal("email", context.req.body_json.email)]
    )
    censored_list = [getattr(user, "$id") for user in target_list]
    context.res.json(censored_list)
