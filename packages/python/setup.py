from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="hogtyped",
    version="0.1.0",
    author="PostHog",
    author_email="engineering@posthog.com",
    description="Code generator for type-safe PostHog wrappers with embedded schemas",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/PostHog/hogtyped",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "hogtyped=hogtyped.__main__:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.9",
    install_requires=[
        "posthog>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=22.0.0",
            "mypy>=1.0.0",
            "ruff>=0.1.0",
        ]
    },
    package_data={
        "hogtyped": ["schemas/*.json"],
    },
)