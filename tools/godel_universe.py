# Gödel rotating-universe loop for "The Hole in Every Map".
# Run headless:
#   still : blender -b -P tools/godel_universe.py -- --still /tmp/godel_still.png
#   anim  : blender -b -P tools/godel_universe.py -- --anim /tmp/godel_frames/
#
# A qualitative model of the Gödel metric's light cones: hourglass cones on
# concentric rings tip toward the azimuthal direction as radius grows; at the
# critical ring (ember) the cone axis lies in the plane of rotation and a
# closed timelike curve threads through. Not a field-equation render.
#
# The loop is seamless: every ring's cone count divides 12, and each ring's
# rotation over the loop is an exact multiple of its own symmetry angle.

import bpy
import math
import sys

ARGS = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

INK = (0x07, 0x07, 0x0A)
BONE = (0xEE, 0xE9, 0xDC)
CYAN = (0x77, 0xE6, 0xEF)
EMBER = (0xFF, 0x3F, 0x54)

FPS = 30
LOOP_FRAMES = 240  # 8 s

# radius, cone count, tip degrees, loop rotation degrees, scale
RINGS = [
    (1.30, 6, 12, 60, 0.30),
    (2.45, 8, 36, 45, 0.34),
    (3.60, 10, 62, 36, 0.38),
    (4.75, 12, 90, 30, 0.42),  # critical ring — ember
    (5.90, 14, 118, 180.0 / 7.0, 0.36),
]
CRITICAL = 3


def action_fcurves(obj):
    action = obj.animation_data.action
    if hasattr(action, "fcurves"):
        return action.fcurves
    curves = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                curves.extend(bag.fcurves)
    return curves


def make_linear(obj):
    for curve in action_fcurves(obj):
        for point in curve.keyframe_points:
            point.interpolation = "LINEAR"


def srgb_to_linear(component):
    s = component / 255.0
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


def linear(rgb):
    return tuple(srgb_to_linear(c) for c in rgb) + (1.0,)


def emission_material(name, rgb, strength):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = linear(rgb)
    emission.inputs["Strength"].default_value = strength
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(emission.outputs[0], output.inputs["Surface"])
    return material


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 1
    scene.frame_end = LOOP_FRAMES
    world = bpy.data.worlds.new("ink")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes["Background"]
    background.inputs["Color"].default_value = linear(INK)
    background.inputs["Strength"].default_value = 1.0
    return scene


def wire_cone(name, material, scale):
    bpy.ops.mesh.primitive_cone_add(
        vertices=6, radius1=1.0, radius2=0.0, depth=1.6, location=(0, 0, 0)
    )
    future = bpy.context.object
    future.name = name
    # shift so the apex sits at the origin: cone apex is at +z depth/2
    for vertex in future.data.vertices:
        vertex.co.z -= 0.8
    # mirror copy = past cone, apex to apex
    past = future.copy()
    past.data = future.data.copy()
    past.scale.z = -1.0
    bpy.context.collection.objects.link(past)
    past.parent = future
    for cone in (future, past):
        wire = cone.modifiers.new("wire", "WIREFRAME")
        wire.thickness = 0.02
        wire.use_replace = True
        cone.data.materials.clear()
        cone.data.materials.append(material)
    future.scale = (scale, scale, scale)
    return future


def torus(name, major, minor, material):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor, major_segments=128, minor_segments=8
    )
    ring = bpy.context.object
    ring.name = name
    ring.data.materials.append(material)
    return ring


def build_scene(scene):
    cyan_mat = emission_material("cone-cyan", CYAN, 1.6)
    cyan_dim = emission_material("cone-cyan-dim", CYAN, 0.55)
    ember_mat = emission_material("cone-ember", EMBER, 4.0)
    bone_mat = emission_material("guide-bone", BONE, 0.55)
    bone_bright = emission_material("axis-bone", BONE, 2.6)
    ember_core = emission_material("core-ember", EMBER, 9.0)

    root = bpy.data.objects.new("universe", None)
    bpy.context.collection.objects.link(root)

    for index, (radius, count, tip_deg, loop_deg, scale) in enumerate(RINGS):
        pivot = bpy.data.objects.new(f"ring-{index}", None)
        bpy.context.collection.objects.link(pivot)
        pivot.parent = root

        is_critical = index == CRITICAL
        beyond = index > CRITICAL
        material = ember_mat if is_critical else (cyan_dim if beyond else cyan_mat)

        for k in range(count):
            phi = (k / count) * math.tau
            cone = wire_cone(f"cone-{index}-{k}", material, scale)
            cone.parent = pivot
            cone.location = (radius * math.cos(phi), radius * math.sin(phi), 0.0)
            cone.rotation_euler = (math.radians(tip_deg), 0.0, phi)

        guide = torus(f"guide-{index}", radius, 0.006, bone_mat)
        guide.parent = root

        # differential rotation, seamless because loop_deg is a multiple of
        # this ring's symmetry angle 360/count
        pivot.rotation_euler = (0.0, 0.0, 0.0)
        pivot.keyframe_insert("rotation_euler", frame=1)
        pivot.rotation_euler = (0.0, 0.0, math.radians(loop_deg))
        pivot.keyframe_insert("rotation_euler", frame=LOOP_FRAMES + 1)
        make_linear(pivot)

    # the closed timelike curve at the critical radius
    ctc = torus("ctc", RINGS[CRITICAL][0], 0.017, emission_material("ctc", EMBER, 6.0))
    ctc.parent = root

    # axis of the universe
    bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=7.5, location=(0, 0, 0))
    axis = bpy.context.object
    axis.data.materials.append(bone_bright)
    axis.parent = root

    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(0, 0, 0))
    core = bpy.context.object
    core.data.materials.append(ember_core)
    core.parent = root

    # 12-fold symmetric dust so the loop stays seamless
    import random

    rng = random.Random(1931)
    dust_mat = emission_material("dust", CYAN, 0.9)
    dust_pivot = bpy.data.objects.new("dust", None)
    bpy.context.collection.objects.link(dust_pivot)
    dust_pivot.parent = root
    seeds = [
        (rng.uniform(0.6, 6.6), rng.uniform(0, math.tau / 12), rng.uniform(-2.0, 2.0), rng.uniform(0.008, 0.02))
        for _ in range(22)
    ]
    for sector in range(12):
        base = sector * math.tau / 12
        for radius, phi, z, size in seeds:
            bpy.ops.mesh.primitive_ico_sphere_add(
                subdivisions=1,
                radius=size,
                location=(radius * math.cos(base + phi), radius * math.sin(base + phi), z),
            )
            grain = bpy.context.object
            grain.data.materials.append(dust_mat)
            grain.parent = dust_pivot
    dust_pivot.rotation_euler = (0.0, 0.0, 0.0)
    dust_pivot.keyframe_insert("rotation_euler", frame=1)
    dust_pivot.rotation_euler = (0.0, 0.0, math.radians(30))
    dust_pivot.keyframe_insert("rotation_euler", frame=LOOP_FRAMES + 1)
    make_linear(dust_pivot)

    # camera
    target = bpy.data.objects.new("target", None)
    bpy.context.collection.objects.link(target)
    target.location = (0.0, 0.0, 0.15)
    camera_data = bpy.data.cameras.new("camera")
    camera_data.lens = 46
    camera = bpy.data.objects.new("camera", camera_data)
    bpy.context.collection.objects.link(camera)
    elevation = math.radians(24)
    distance = 16.5
    camera.location = (
        0.0,
        -distance * math.cos(elevation),
        distance * math.sin(elevation),
    )
    constraint = camera.constraints.new("TRACK_TO")
    constraint.target = target
    scene.camera = camera


def setup_render(scene, width, height, samples):
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "Standard"
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.cycles.device = "GPU"
    preferences = bpy.context.preferences.addons["cycles"].preferences
    try:
        preferences.compute_device_type = "METAL"
        for device in preferences.get_devices_for_type("METAL"):
            device.use = True
    except Exception as error:  # CPU fallback keeps the render correct
        print("METAL unavailable, using CPU:", error)
        scene.cycles.device = "CPU"

    # bloom via compositor glare — best-effort across API versions
    try:
        scene.use_nodes = True
        tree = scene.node_tree
        tree.nodes.clear()
        layers = tree.nodes.new("CompositorNodeRLayers")
        glare = tree.nodes.new("CompositorNodeGlare")
        try:
            glare.glare_type = "BLOOM"
        except TypeError:
            glare.glare_type = "FOG_GLOW"
        for attribute, value in (("quality", "HIGH"), ("mix", -0.35), ("threshold", 0.9), ("size", 8)):
            try:
                setattr(glare, attribute, value)
            except Exception:
                pass
        composite = tree.nodes.new("CompositorNodeComposite")
        tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
        tree.links.new(glare.outputs["Image"], composite.inputs["Image"])
    except Exception as error:
        print("compositor glare skipped:", error)


def main():
    mode = ARGS[0] if ARGS else "--still"
    out = ARGS[1] if len(ARGS) > 1 else "/tmp/godel_still.png"
    scene = reset_scene()
    build_scene(scene)
    if mode == "--still":
        setup_render(scene, 1280, 720, 96)
        scene.frame_set(1)
        scene.render.filepath = out
        bpy.ops.render.render(write_still=True)
    else:
        setup_render(scene, 1280, 720, 96)
        if len(ARGS) > 3:  # --anim out start end
            scene.frame_start = int(ARGS[2])
            scene.frame_end = int(ARGS[3])
        scene.render.filepath = out
        bpy.ops.render.render(animation=True)


main()
