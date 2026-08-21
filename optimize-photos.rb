#!/usr/bin/env ruby
# Create web-sized JPEGs for the photography gallery.
# thumbs = grid (not noticeably softer), view = lightbox click quality.

require 'fileutils'
require 'shellwords'

html = File.read('photography.html')
srcs = html.scan(/<img[^>]+src="([^"]+)"/).flatten.uniq
srcs.reject! { |s| s.start_with?('data:') || s.include?('/thumbs/') || s.include?('/view/') || s.end_with?('.svg') || s.end_with?('.png') }

def out_path(src, kind)
  # assets/edited photos/whitedress.JPG -> assets/thumbs/edited photos/whitedress.jpg
  rel = src.sub(/^assets\//, '')
  base = File.basename(rel).sub(/\.(jpe?g|png)$/i, '.jpg')
  dir = File.join('assets', kind, File.dirname(rel))
  FileUtils.mkdir_p(dir)
  File.join(dir, base)
end

def long_edge(path)
  q = Shellwords.escape(path)
  w = `sips -g pixelWidth #{q} 2>/dev/null`[/pixelWidth:\s+(\d+)/, 1].to_i
  h = `sips -g pixelHeight #{q} 2>/dev/null`[/pixelHeight:\s+(\d+)/, 1].to_i
  [w, h].max
end

def resize(src, dest, max_edge, quality)
  return unless File.exist?(src)
  FileUtils.mkdir_p(File.dirname(dest))
  edge = long_edge(src)
  qsrc = Shellwords.escape(src)
  qdest = Shellwords.escape(dest)
  cmd = if edge > max_edge
    "sips -Z #{max_edge} -s format jpeg -s formatOptions #{quality} #{qsrc} --out #{qdest}"
  else
    "sips -s format jpeg -s formatOptions #{quality} #{qsrc} --out #{qdest}"
  end
  ok = system("#{cmd} >/dev/null")
  puts(ok ? "ok  #{dest}" : "FAIL #{src}")
end

puts "Found #{srcs.length} gallery images"
srcs.each do |src|
  unless File.exist?(src)
    puts "MISSING #{src}"
    next
  end
  resize(src, out_path(src, 'thumbs'), 1400, 82)
  resize(src, out_path(src, 'view'), 3200, 88)
end

html2 = html.gsub(/<img([^>]*)>/) do |tag|
  attrs = $1
  src = attrs[/src="([^"]+)"/, 1]
  next tag if src.nil? || src.start_with?('data:') || src.include?('/thumbs/') || src.include?('/view/') || src.end_with?('.svg') || src.end_with?('.png')
  thumb = out_path(src, 'thumbs')
  view = out_path(src, 'view')
  attrs = attrs.sub(/src="[^"]+"/, %(src="#{thumb}"))
  unless attrs.include?('data-full=')
    attrs += %( data-full="#{view}")
  else
    attrs = attrs.sub(/data-full="[^"]+"/, %(data-full="#{view}"))
  end
  unless attrs.include?('data-thumb=')
    attrs += %( data-thumb="#{thumb}")
  end
  %(<img#{attrs}>)
end

File.write('photography.html', html2)
puts 'Updated photography.html'
