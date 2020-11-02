# Setup
Create a `config.toml`
```
baseURL = "https://my-book-site.com/"
languageCode = "en-us"
title = "Books!"

[deployment]
# By default, files are uploaded in an arbitrary order.
# Files that match the regular expressions in the "Order" list
# will be uploaded first, in the listed order.
# order = [".jpg$", ".gif$"]


[[deployment.targets]]
# An arbitrary name for this target.
name = "prod"
# The Go Cloud Development Kit URL to deploy to. Examples:
# GCS; see https://gocloud.dev/howto/blob/#gcs
# URL = "gs://<Bucket Name>"

# S3; see https://gocloud.dev/howto/blob/#s3
# For S3-compatible endpoints, see https://gocloud.dev/howto/blob/#s3-compatible
URL = "s3://my-bucket?region=my-region"
```

# Build book library
1. Drag `.azw3` files into Calibre import folder (`~/books`)
2. Wait for Calibre to convert them
3. Run `gulp`

# Build
```
hugo
```

# Deploy
```
hugo deploy
```
