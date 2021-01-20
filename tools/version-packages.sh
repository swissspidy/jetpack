#!/bin/bash

set -eo pipefail

# This script updates the composer.json file in of whatever directory it is run.
# It will update any packages prefixed with `automattic/jetpack-` to it's latest stable version.
#
# Probably will be most useful in the release scripts that branch off, since we:
# a. Want to ship Jetpack with specific versions of packages
# b. Want to preserve @dev in master branch

function usage {
	cat <<-EOH
		usage: $0 [options] <directory>

		Most options accepted by \`composer require\` are accepted to pass on
		to composer while updating dependencies.
	EOH
	exit 1
}

DIR=
function check_dir {
	if [[ ! -z "$DIR" ]]; then
		echo "Only one directory may be specified." >&2
		return 1
	elif [[ -d "$1" ]]; then
		DIR="${1%/}"
		if [[ ! -f "$DIR/composer.json" ]]; then
			echo "$DIR does not contain composer.json." >&2
			return 1
		fi
	elif [[ "$1" == "*/composer.json" && -f "$1" ]]; then # DWIM
		DIR="$(dirname "$1")"
	else
		echo "Directory $1 does not exist." >&2
		return 1
	fi
}

BASE=$(cd $(dirname "${BASH_SOURCE[0]}")/.. && pwd)
COMPOSER_ARGS=()
while [[ $# -gt 0 ]]; do
	arg="$1"
	shift
	case $arg in
		-h|--help)
			usage
			exit
			;;
		--dev|-V|--version|-d|--working-dir|--working-dir=*)
			echo "Cannot pass $arg on to composer." >&2
			exit 1
			;;
		--)
			while [[ $# -gt 0 ]]; do
				check_dir "$1"
				shift
			done
			;;
		-*)
			COMPOSER_ARGS+=( "$arg" )
			;;
		*)
			check_dir "$arg"
			;;
	esac
done
if [[ -z "$DIR" ]]; then
	usage
fi

# Remove the monorepo repo from composer.json.
JSON=$(jq 'if .repositories then .repositories |= map( select( .options.monorepo | not ) ) else . end' "$DIR/composer.json" | "$JETPACK_ROOT/tools/prettier" --parser=json-stringify)
echo "$JSON" > "$DIR/composer.json"

# Get the list of package names to update.
PACKAGES=$(jq -nc 'reduce inputs as $in ([]; . + [ $in.name ])' "$BASE"/projects/packages/*/composer.json)

# Update the packages that appear in composer.json
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.require // {} | to_entries | .[] | select( .value == "@dev" and ( [ .key ] | inside( $packages ) ) ) | .key' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	echo "Updating packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --working-dir="$DIR" -- "${TO_UPDATE[@]}"
fi
TO_UPDATE=()
mapfile -t TO_UPDATE < <(jq -r --argjson packages "$PACKAGES" '.["require-dev"] // {} | to_entries | .[] | select( .value == "@dev" and ( [ .key ] | inside( $packages ) ) ) | .key' "$DIR/composer.json")
if [[ ${#TO_UPDATE[@]} -gt 0 ]]; then
	echo "Updating dev packages: ${TO_UPDATE[*]}..."
	composer require "${COMPOSER_ARGS[@]}" --working-dir="$DIR" --dev -- "${TO_UPDATE[@]}"
fi
