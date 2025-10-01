# cgi_compat.py - Compatibility module for Python 3.13
# This provides basic cgi functionality needed by spyne

import urllib.parse
import io
import sys

def parse_qs(qs, keep_blank_values=False, strict_parsing=False, encoding='utf-8', errors='replace', max_num_fields=None, separator='&'):
    """Parse a query string given as a string argument."""
    return urllib.parse.parse_qs(qs, keep_blank_values, strict_parsing, encoding, errors, max_num_fields, separator)

def parse_qsl(qs, keep_blank_values=False, strict_parsing=False, encoding='utf-8', errors='replace', max_num_fields=None, separator='&'):
    """Parse a query string given as a string argument."""
    return urllib.parse.parse_qsl(qs, keep_blank_values, strict_parsing, encoding, errors, max_num_fields, separator)

def parse_header(line):
    """Parse a Content-type like header.
    
    Return the main content-type and a dictionary containing
    options.  
    """
    if not line:
        return '', {}
    
    # Split on semicolon
    parts = line.split(';')
    main_type = parts[0].strip()
    
    # Parse parameters
    pdict = {}
    for p in parts[1:]:
        if '=' in p:
            name, value = p.split('=', 1)
            name = name.strip().lower()
            value = value.strip()
            # Remove quotes if present
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            pdict[name] = value
    
    return main_type, pdict

def escape(s, quote=False):
    """Replace special characters with HTML entities."""
    import html
    return html.escape(s, quote)

# Add this module to sys.modules as 'cgi'
sys.modules['cgi'] = sys.modules[__name__]