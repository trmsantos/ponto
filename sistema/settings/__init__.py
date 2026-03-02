local = None

try:
   from .local import *
except ImportError:
   pass

if local is None:
   try:
      from .docker import *
   except ImportError:
      pass

#try:
#   from .production import *
#except:
#   pass

# try:
#    from .test import *
# except:
#    pass
