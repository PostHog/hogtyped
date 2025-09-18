#!/usr/bin/env python3
"""
CLI for HogTyped Python code generation.
"""

import argparse
import sys
from .codegen import generate_wrapper


def main():
    parser = argparse.ArgumentParser(
        prog='hogtyped',
        description='Generate a type-safe PostHog wrapper with embedded schemas'
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Generate command
    generate_parser = subparsers.add_parser(
        'generate',
        help='Generate a Python wrapper from JSON schemas'
    )
    generate_parser.add_argument(
        '-s', '--schemas',
        default='./schemas/*.schema.json',
        help='Schema file pattern (default: ./schemas/*.schema.json)'
    )
    generate_parser.add_argument(
        '-o', '--output',
        default='./posthog_generated.py',
        help='Output file path (default: ./posthog_generated.py)'
    )
    generate_parser.add_argument(
        '-c', '--class-name',
        default='PostHog',
        help='Generated class name (default: PostHog)'
    )
    generate_parser.add_argument(
        '-m', '--mode',
        default='warning',
        choices=['strict', 'warning', 'disabled'],
        help='Default validation mode (default: warning)'
    )

    # Init command
    init_parser = subparsers.add_parser(
        'init',
        help='Initialize HogTyped in your project'
    )

    args = parser.parse_args()

    if args.command == 'generate':
        print('🐗 HogTyped Generator (Python)\n')

        try:
            generate_wrapper(
                schemas=args.schemas,
                output=args.output,
                class_name=args.class_name,
                validation_mode=args.mode
            )

            print(f'\n📝 Next steps:')
            print(f'1. Import your generated wrapper:')
            print(f'   from {args.output[:-3].replace("/", ".")} import {args.class_name.lower()}')
            print(f'\n2. Use it with full type hints:')
            print(f'   {args.class_name.lower()}.capture(')
            print(f'       distinct_id="user-123",')
            print(f'       event="event_name",  # Type hints available!')
            print(f'       properties={{...}}')
            print(f'   )')

        except Exception as e:
            print(f'❌ Error generating wrapper: {e}', file=sys.stderr)
            sys.exit(1)

    elif args.command == 'init':
        import os
        import json

        print('🐗 Initializing HogTyped...\n')

        # Create schemas directory
        if not os.path.exists('./schemas'):
            os.makedirs('./schemas')
            print('✅ Created schemas/ directory')

        # Create example schema
        example_schema = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "definitions": {
                "PageView": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "format": "uri"},
                        "title": {"type": "string"},
                        "referrer": {"type": "string", "format": "uri"}
                    },
                    "required": ["url"]
                }
            },
            "events": {
                "page_viewed": {"$ref": "#/definitions/PageView"}
            }
        }

        schema_path = './schemas/events.schema.json'
        if not os.path.exists(schema_path):
            with open(schema_path, 'w') as f:
                json.dump(example_schema, f, indent=2)
            print('✅ Created example schema at schemas/events.schema.json')

        print('\n📝 Next steps:')
        print('1. Edit your schemas in schemas/events.schema.json')
        print('2. Run: python -m hogtyped generate')
        print('3. Import and use your generated wrapper')

    else:
        parser.print_help()


if __name__ == '__main__':
    main()